#!/usr/bin/env python3
"""Prepare small browser assets for VMR case 0225_H_AO_COA.

The source surface and image volume are VTK XML files with appended base64
payloads.  This script intentionally keeps the VTK parser local and only
exports a reduced surface plus a small set of display-ready MR slices.  The
generated metadata records the source coordinate frame and every display
transform; it does not claim image/surface registration.
"""

from __future__ import annotations

import base64
import binascii
import json
import math
import re
import shutil
import struct
import zlib
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cardiovascular_demo_2026-10-07"
OUT = ROOT / "public" / "vmr-0225"


def b64_segments(encoded: str) -> list[str]:
    """Return the separately padded base64 runs emitted by VTK."""

    compact = "".join(encoded.split())
    return re.findall(r"[A-Za-z0-9+/]+={0,2}", compact)


def decode_vtk_array(encoded: str) -> bytes:
    """Decode one VTK appended array, including block-zlib compression."""

    payload = b"".join(base64.b64decode(segment) for segment in b64_segments(encoded))
    if len(payload) < 4:
        return payload

    # VTK's compressed header is:
    # number_of_blocks, block_size, last_block_size, compressed_size[...].
    block_count = struct.unpack_from("<I", payload, 0)[0]
    if len(payload) >= 12 and 0 < block_count < 1_000_000:
        block_size, last_block_size = struct.unpack_from("<2I", payload, 4)
        header_size = 12 + block_count * 4
        if block_size and header_size <= len(payload):
            sizes = struct.unpack_from(f"<{block_count}I", payload, 12)
            if header_size + sum(sizes) <= len(payload):
                cursor = header_size
                blocks: list[bytes] = []
                for size in sizes:
                    blocks.append(zlib.decompress(payload[cursor : cursor + size]))
                    cursor += size
                decoded = b"".join(blocks)
                expected_last = last_block_size or block_size
                if decoded and len(decoded) >= expected_last:
                    return decoded

    # Uncompressed VTK appended arrays have a UInt32 byte count prefix.
    byte_count = struct.unpack_from("<I", payload, 0)[0]
    if byte_count + 4 <= len(payload):
        return payload[4 : 4 + byte_count]
    return payload


def appended_text(source: Path) -> tuple[str, str, ET.Element]:
    text = source.read_text(encoding="utf-8")
    marker = '<AppendedData encoding="base64">'
    before, after = text.split(marker, 1)
    encoded, _ = after.split("</AppendedData>", 1)
    compact = "".join(encoded[encoded.find("_") + 1 :].split())
    root = ET.fromstring(before + "</VTKFile>")
    return text, compact, root


def vtk_appended_arrays(source: Path) -> dict[str, tuple[dict[str, str], bytes]]:
    """Read named appended arrays; offsets are base64-character offsets."""

    _, compact, root = appended_text(source)
    arrays = [
        element.attrib
        for element in root.findall(".//DataArray")
        if element.attrib.get("format") == "appended"
    ]
    arrays.sort(key=lambda attrs: int(attrs["offset"]))
    decoded: dict[str, tuple[dict[str, str], bytes]] = {}
    for index, attrs in enumerate(arrays):
        start = int(attrs["offset"])
        end = int(arrays[index + 1]["offset"]) if index + 1 < len(arrays) else len(compact)
        name = attrs.get("Name", f"array-{index}")
        decoded[name] = (attrs, decode_vtk_array(compact[start:end]))
    return decoded


def unpack_points(payload: bytes) -> list[tuple[float, float, float]]:
    if len(payload) % 12:
        raise ValueError(f"Points payload is not Float32 xyz data: {len(payload)} bytes")
    return list(struct.iter_unpack("<3f", payload))


def load_surface() -> tuple[list[tuple[float, float, float]], list[tuple[int, int, int]]]:
    arrays = vtk_appended_arrays(SOURCE / "P001.vtp")
    points = unpack_points(arrays["Points"][1])
    connectivity = arrays["connectivity"][1]
    offsets = arrays["offsets"][1]
    # There are three empty arrays for verts/lines/strips before polygon data.
    if len(connectivity) != 50212 * 3 * 8:
        # The dict keeps the last arrays with the same name, so retrieve the
        # polygon arrays directly by their XML order when needed.
        _, compact, root = appended_text(SOURCE / "P001.vtp")
        arrays_xml = [
            element.attrib
            for element in root.findall(".//DataArray")
            if element.attrib.get("format") == "appended"
        ]
        arrays_xml.sort(key=lambda attrs: int(attrs["offset"]))
        named: list[tuple[dict[str, str], bytes]] = []
        for index, attrs in enumerate(arrays_xml):
            start = int(attrs["offset"])
            end = int(arrays_xml[index + 1]["offset"]) if index + 1 < len(arrays_xml) else len(compact)
            named.append((attrs, decode_vtk_array(compact[start:end])))
        connectivity = next(
            data
            for attrs, data in named
            if attrs.get("Name") == "connectivity" and len(data) == 50212 * 3 * 8
        )
        offsets = next(
            data
            for attrs, data in named
            if attrs.get("Name") == "offsets" and len(data) == 50212 * 8
        )

    indices = list(struct.iter_unpack("<q", connectivity))
    polygon_indices = [row[0] for row in indices]
    # The source is all triangles and its offsets are 3, 6, ..., so the
    # connectivity stream can be emitted directly as Uint32 triangles.
    if len(polygon_indices) % 3:
        raise ValueError("P001 polygon connectivity is not triangular")
    triangles = [
        tuple(polygon_indices[i : i + 3])
        for i in range(0, len(polygon_indices), 3)
    ]
    if max(max(triangle) for triangle in triangles) >= len(points):
        raise ValueError("P001 connectivity references a missing point")
    return points, triangles


def write_surface() -> dict[str, object]:
    points, triangles = load_surface()
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    center = [(minimum[axis] + maximum[axis]) / 2 for axis in range(3)]
    size = [maximum[axis] - minimum[axis] for axis in range(3)]
    # Keep all geometry in one normalized world radius.  The raw VTP has a
    # long superior-inferior z axis.  Mapping raw z to viewer y makes the arch
    # legible in the viewer while preserving a right-handed coordinate frame.
    scale = 2.0 / max(size)

    transformed = []
    for x, y, z in points:
        transformed.extend(
            (
                (x - center[0]) * scale,
                (z - center[2]) * scale,
                -(y - center[1]) * scale,
            )
        )
    flattened_indices = [index for triangle in triangles for index in triangle]
    surface_path = OUT / "surface.bin"
    surface_path.write_bytes(
        struct.pack("<2I", len(points), len(flattened_indices))
        + struct.pack(f"<{len(transformed)}f", *transformed)
        + struct.pack(f"<{len(flattened_indices)}I", *flattened_indices)
    )

    viewer_min = [min(transformed[axis::3]) for axis in range(3)]
    viewer_max = [max(transformed[axis::3]) for axis in range(3)]
    viewer_size = [viewer_max[axis] - viewer_min[axis] for axis in range(3)]
    metadata: dict[str, object] = {
        "case": "0225_H_AO_COA",
        "units": "normalized viewer world (source values are cm as stored)",
        "source": {
            "surface": "cardiovascular_demo_2026-10-07/P001.vtp",
            "geometryRole": "surface used by the supplied CFD movie",
            "relationToStep": "P001.vtp and the supplied STEP are related case geometry; exact registration/equality is not asserted",
            "sourceCoordinateUnits": "cm (as stored in the supplied surface/handoff)",
            "sourceCoordinateSystem": "VTK XYZ; no source coordinates were modified",
        },
        "format": {
            "file": "surface.bin",
            "header": "uint32le vertexCount, uint32le indexCount",
            "positions": "vertexCount * 3 float32le viewer xyz",
            "indices": "indexCount uint32le triangle indices",
            "indexCountMeaning": "number of scalar indices, divisible by three",
        },
        "counts": {
            "vertices": len(points),
            "triangles": len(triangles),
            "indices": len(flattened_indices),
        },
        "sourceBounds": {"min": minimum, "max": maximum},
        "sourceCenter": center,
        "sourceSize": size,
        "center": [0.0, 0.0, 0.0],
        "size": viewer_size,
        "bounds": {"min": viewer_min, "max": viewer_max},
        "viewerBounds": {
            "min": viewer_min,
            "max": viewer_max,
        },
        "viewerTransform": {
            "formula": "viewer = [(rawX-centerX)*scale, (rawZ-centerZ)*scale, -(rawY-centerY)*scale]",
            "scale": scale,
            "rawAxisToViewer": {"viewerX": "rawX+", "viewerY": "rawZ+", "viewerZ": "rawY-"},
            "recommendedUp": "raw Z positive / viewer Y positive",
            "recommendedFront": "raw Y negative / viewer Z positive",
            "registrationStatus": "surface transform is display normalization only; it is not an MR registration",
        },
    }
    (OUT / "surface.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", binascii.crc32(kind + payload) & 0xFFFFFFFF)


def write_gray_png(path: Path, values: tuple[int, ...], width: int, height: int, *, scale_x: int = 2, scale_y: int = 2) -> None:
    if len(values) != width * height:
        raise ValueError("slice voxel count does not match image dimensions")
    window_min, window_max = 0, 12000
    source_rows: list[bytes] = []
    for row in range(height):
        row_values = values[row * width : (row + 1) * width]
        mapped = bytes(
            min(255, max(0, round((value - window_min) * 255 / (window_max - window_min))))
            for value in row_values
        )
        source_rows.append(mapped)
    rows = []
    for row in source_rows:
        expanded = b"".join(bytes((value,)) * scale_x for value in row)
        expanded_row = expanded * 1
        rows.extend([expanded_row] * scale_y)
    out_width, out_height = width * scale_x, height * scale_y
    raw = b"".join(b"\x00" + row for row in rows)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", out_width, out_height, 8, 0, 0, 0, 0))
    png += png_chunk(b"IDAT", zlib.compress(raw, level=6))
    png += png_chunk(b"IEND", b"")
    path.write_bytes(png)


def coronal_palette(value: int) -> bytes:
    """Map MR intensity to a blue/cyan display palette, never a tissue label."""
    stops = (
        (0.00, (5, 12, 48)),
        (0.16, (11, 30, 87)),
        (0.35, (20, 66, 125)),
        (0.56, (28, 117, 165)),
        (0.78, (53, 179, 187)),
        (1.00, (159, 234, 211)),
    )
    t = min(1.0, max(0.0, value / 6500.0))
    for (start, first), (end, second) in zip(stops, stops[1:]):
        if t <= end:
            blend = (t - start) / (end - start)
            return bytes(round(a + (b - a) * blend) for a, b in zip(first, second))
    return bytes(stops[-1][1])


def write_coronal_png(path: Path, voxels: memoryview, y_index: int, width: int, height: int, depth: int) -> None:
    """Export an actual x-z reslice at one source y index (superior at top)."""
    expanded_palette = [coronal_palette(value) * 2 for value in range(6501)]
    rows: list[bytes] = []
    for z_index in range(depth - 1, -1, -1):
        start = z_index * width * height + y_index * width
        row = b"".join(expanded_palette[min(6500, max(0, voxels[start + x]))] for x in range(width))
        rows.extend((row, row))
    raw = b"".join(b"\x00" + row for row in rows)
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png += png_chunk(b"IHDR", struct.pack(">IIBBBBB", width * 2, depth * 2, 8, 2, 0, 0, 0))
    png += png_chunk(b"IDAT", zlib.compress(raw, level=6))
    png += png_chunk(b"IEND", b"")
    path.write_bytes(png)


def write_coronal_slices() -> dict[str, object]:
    """Expose coronal MR views without claiming a CT scan or mask."""
    arrays = vtk_appended_arrays(SOURCE / "0225_H_AO_COA.vti")
    payload = arrays["Scalars_"][1]
    width, height, depth = 300, 240, 280
    if len(payload) != width * height * depth * 2:
        raise ValueError("MR volume payload does not match the declared dimensions")
    voxels = memoryview(payload).cast("h")
    selected = list(range(70, 171, 10))
    coronal_dir = OUT / "coronal"
    coronal_dir.mkdir(parents=True, exist_ok=True)
    entries = []
    for index in selected:
        filename = f"coronal/mr-y-{index:03d}.png"
        write_coronal_png(OUT / filename, voxels, index, width, height, depth)
        entries.append({
            "file": filename,
            "index": index,
            "rawY": -19.500700378 + index * 0.12,
            "sourceDimensions": [width, depth],
            "outputDimensions": [width * 2, depth * 2],
        })
    metadata: dict[str, object] = {
        "case": "0225_H_AO_COA",
        "modality": "MR",
        "source": "cardiovascular_demo_2026-10-07/0225_H_AO_COA.vti",
        "sourceArray": {"type": "Int16", "name": "Scalars_", "byteOrder": "LittleEndian"},
        "plane": "coronal x-z view at fixed source y index",
        "imageAxisOrder": "source x increases left-to-right; source z increases toward the top of the PNG",
        "display": {
            "format": "8-bit RGB PNG",
            "palette": "navy-cyan intensity display only; colors do not represent a segmentation",
            "window": {"min": 0, "max": 6500, "clipping": "saturate"},
            "resampling": "nearest-neighbor 2x export from source 300x280 to 600x560",
        },
        "registrationStatus": "MR source preview only; no MR-to-P001 registration or mask is asserted",
        "defaultIndex": selected.index(110),
        "slices": entries,
    }
    (OUT / "coronal.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


def write_slices() -> dict[str, object]:
    arrays = vtk_appended_arrays(SOURCE / "0225_H_AO_COA.vti")
    payload = arrays["Scalars_"][1]
    dimensions = (300, 240, 280)
    expected = math.prod(dimensions) * 2
    if len(payload) != expected:
        raise ValueError(f"VTI payload length {len(payload)} != {expected}")
    origin = [-19.002200317, -19.500700378, -15.194999695]
    spacing = [0.12, 0.12, 0.10999908447]
    # These source-index slices run from the upper thorax through the
    # descending/abdominal region.  The 112 slice is a useful arch/heart
    # starting view.  They are selected for visual continuity only; no
    # surface/MR registration is inferred from this selection.
    selected = [80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200]
    slice_dir = OUT / "slices"
    slice_dir.mkdir(parents=True, exist_ok=True)
    for old_slice in slice_dir.glob("mr-*.png"):
        old_slice.unlink()
    entries = []
    width, height, depth = dimensions
    voxels_per_slice = width * height
    for index in selected:
        values = struct.unpack_from(f"<{voxels_per_slice}h", payload, index * voxels_per_slice * 2)
        filename = f"slices/mr-{index:03d}.png"
        write_gray_png(OUT / filename, values, width, height)
        entries.append(
            {
                "file": filename,
                "index": index,
                "rawZ": origin[2] + index * spacing[2],
                "z": origin[2] + index * spacing[2],
                "label": f"MR slice {index}",
                "sourceDimensions": [width, height],
                "outputDimensions": [width * 2, height * 2],
            }
        )
    metadata: dict[str, object] = {
        "case": "0225_H_AO_COA",
        "modality": "MR",
        "source": "cardiovascular_demo_2026-10-07/0225_H_AO_COA.vti",
        "sourceArray": {"type": "Int16", "name": "Scalars_", "byteOrder": "LittleEndian"},
        "dimensions": list(dimensions),
        "origin": origin,
        "spacing": spacing,
        "coordinateNote": "rawZ is the source VTI image coordinate. The companion header labels units mm; this export does not rescale or claim correspondence to surface coordinates.",
        "imageAxisOrder": "source x increases left-to-right in PNG; source y increases top-to-bottom; source z is slice index",
        "display": {
            "format": "8-bit grayscale PNG",
            "window": {"min": 0, "max": 12000, "clipping": "saturate"},
            "resampling": "nearest-neighbor 2x export from source 300x240 to 600x480",
        },
        "registrationStatus": "MR slice previews only; no MR-to-surface overlay or registration is asserted",
        "defaultSlice": 112,
        "defaultIndex": selected.index(112),
        "slices": entries,
    }
    (OUT / "slices.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return metadata


def copy_provenance() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for filename in (
        "LICENSE.txt",
        "README-COPYRIGHT",
        "0225_H_AO_COA_lumen_smooth.step",
        "0225_H_AO_COA.pdf",
        "0225_H_AO_COA.vti.hdr",
        "image_information.xml",
    ):
        if filename in {"0225_H_AO_COA.vti.hdr", "image_information.xml"}:
            # The tracked web copies use one final newline. Keep regeneration
            # byte-stable even though the source XML files have an extra one.
            (OUT / filename).write_bytes((SOURCE / filename).read_bytes().rstrip(b"\n") + b"\n")
        else:
            shutil.copy2(SOURCE / filename, OUT / filename)


def main() -> None:
    copy_provenance()
    surface = write_surface()
    slices = write_slices()
    coronal = write_coronal_slices()
    print(
        json.dumps(
            {
                "surface": {"vertices": surface["counts"]["vertices"], "triangles": surface["counts"]["triangles"]},
                "slices": [entry["index"] for entry in slices["slices"]],
                "coronal": [entry["index"] for entry in coronal["slices"]],
                "output": str(OUT),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
