import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { BRANCH_LENGTH_MM, DEMO_LESIONS, LESION_POSITION, demoRatioAt, demoSeverityAt, getDemoLesion, type CoronaryBranchId, type DemoPlan, type ProbeSelectionProps } from './coronaryDemoData'
import { coronaryCurve, demoRatioColor, segmentCurve } from './coronaryGeometry'
import './CoronaryEnhancements.css'

type Props = ProbeSelectionProps & { mode?: 'physiology'|'plaque'|'plan'; resetKey?: number; plan?: DemoPlan; height?: number }
function Camera({ resetKey, plan }: {resetKey: number; plan?: DemoPlan}) {
  const {camera,size}=useThree()
  useEffect(()=>{
    if(!(camera instanceof THREE.PerspectiveCamera)) return
    const distance= Math.max(4.7, 3.6 / Math.max(.55,size.width/size.height))
    const azimuth=THREE.MathUtils.degToRad(plan?.lao ?? 12)
    const elevation=THREE.MathUtils.degToRad(plan?.cranial ?? 8)
    camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance, Math.sin(elevation)*distance-.1, Math.cos(azimuth)*Math.cos(elevation)*distance)
    camera.lookAt(0,-.1,0)
    camera.updateProjectionMatrix()
  },[camera,size.width,size.height,resetKey,plan?.lao,plan?.cranial])
  return <OrbitControls makeDefault target={[0,-.1,0]} enablePan={false} minDistance={2.8} maxDistance={9} enableDamping />
}
function Branch({branch, ...props}: Props & {branch:CoronaryBranchId}) {
  const curve=useMemo(()=>coronaryCurve(branch),[branch])
  const pieces=useMemo(()=>Array.from({length:32},(_,i)=>({path:segmentCurve(curve,i/32,(i+1)/32),t:(i+.5)/32})),[curve])
  function pick(e:ThreeEvent<MouseEvent>) {
    if(e.delta>4)return
    e.stopPropagation()
    let t=0, distance=Infinity
    for(let i=0;i<=200;i++){const d=curve.getPointAt(i/200).distanceToSquared(e.point);if(d<distance){distance=d;t=i/200}}
    const closest=DEMO_LESIONS.filter(l=>l.branch===branch).reduce((a,b)=>Math.abs(LESION_POSITION[a.id]-t)<Math.abs(LESION_POSITION[b.id]-t)?a:b)
    props.onSelectLesion(closest.id)
    props.onProbeTChange(t)
  }
  return <group>
    {pieces.map((p,i)=><mesh key={i} onClick={pick}>
      <tubeGeometry args={[p.path,5, Math.max(.018,.046*(1-demoSeverityAt(branch,p.t)/150)),10,false]}/>
      <meshStandardMaterial color={props.mode==='plaque'?(demoSeverityAt(branch,p.t)>5?'#e6b36f':'#5eb7b3'):demoRatioColor(demoRatioAt(branch,p.t))} roughness={.4}/>
    </mesh>)}
    {[.3,.59,.83].map((t,i)=>{
      const start=curve.getPointAt(t), end=start.clone().add(new THREE.Vector3(branch==='rca'?-.3:.31, -.17, i%2===0?.17:-.13))
      const side=new THREE.CatmullRomCurve3([start,start.clone().lerp(end,.55).add(new THREE.Vector3(0,.04,0)),end])
      return <mesh key={t}><tubeGeometry args={[side,14,.018,8,false]}/><meshStandardMaterial color={demoRatioColor(demoRatioAt(branch,t))}/></mesh>
    })}
  </group>
}
function Scene(props:Props) {
  const selected=getDemoLesion(props.selectedLesionId)
  const curve=useMemo(()=>coronaryCurve(selected.branch),[selected.branch])
  const position=curve.getPointAt(props.probeT)
  const half=(props.plan?.stentLength??selected.lengthMm)/BRANCH_LENGTH_MM[selected.branch]/2
  const from=Math.max(0,LESION_POSITION[selected.id]-half), to=Math.min(1,LESION_POSITION[selected.id]+half)
  const stent=useMemo(()=>segmentCurve(curve,from,to),[curve,from,to])
  return <>
    <ambientLight intensity={1.7}/><directionalLight position={[2,3,4]} intensity={2}/><directionalLight position={[-3,-1,2]} intensity={.8} color="#77bdd9"/>
    {(['lad','lcx','rca'] as const).map(branch=><Branch key={branch} branch={branch} {...props}/>)}
    {DEMO_LESIONS.map(l=><mesh key={l.id} position={coronaryCurve(l.branch).getPointAt(LESION_POSITION[l.id])} onClick={e=>{if(e.delta>4)return;e.stopPropagation();props.onSelectLesion(l.id);props.onProbeTChange(LESION_POSITION[l.id])}}>
      <sphereGeometry args={[l.id === selected.id ? .072 : .056,16,12]}/><meshBasicMaterial color={l.id===selected.id?'#ffd587':'#d99bbd'}/>
    </mesh>)}
    <mesh position={position}><sphereGeometry args={[.032,16,12]}/><meshBasicMaterial color="#ffffff" depthTest={false}/></mesh>
    {props.mode==='plaque'&&<mesh position={position} rotation={[Math.PI/2,0,0]}><ringGeometry args={[.105,.115,40]}/><meshBasicMaterial color="#f4d284" side={THREE.DoubleSide}/></mesh>}
    {props.mode==='plan'&&<><mesh><tubeGeometry args={[stent,18,.065,10,false]}/><meshBasicMaterial color="#fff0b1" wireframe transparent opacity={.65}/></mesh>{[from,to].map(t=><mesh key={t} position={curve.getPointAt(t)}><sphereGeometry args={[.055,16,10]}/><meshBasicMaterial color="#ffd587"/></mesh>)}</>}
    <Camera resetKey={props.resetKey??0} plan={props.plan}/>
  </>
}
export default function CoronaryModelView(props:Props) {
  return <div className="coronary-model" style={{height:props.height??340}}>
    <Canvas frameloop="demand" camera={{position:[0,0,5],fov:34,near:.1,far:30}} dpr={[1,1.7]}><color attach="background" args={['#071d2a']}/><Scene {...props}/></Canvas>
    <span className="coronary-model__badge">SIM-COR-01 · GIẢ LẬP</span>
  </div>
}
