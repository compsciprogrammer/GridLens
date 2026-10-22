import React,{useEffect,useState} from 'react';
import {SafeAreaView,View,Text,TextInput,ScrollView,Image,TouchableOpacity,Alert,ActivityIndicator,StyleSheet,StatusBar,Linking} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {API_URL} from './config';
import Svg,{Rect,Path,Circle,Line,Ellipse,Text as SvgText,G,Polygon} from 'react-native-svg';

const INK='#202b2e', MUTED='#6d7778', GOLD='#f4c433', GREEN='#427f55', BG='#fffefa';
const HAZARDS=[
 {id:'touching',title:'Touching the line',description:'Branches rest on or wrap around the wire.',caption:'Touching the line',offset:0},
 {id:'within',title:'Within 10 feet',description:'A strong wind could push it into the line.',caption:'Near the line',offset:36},
 {id:'growing',title:'Growing toward it',description:'Not close yet, but it is heading that way.',caption:'Not close yet',offset:76},
];
const timeout=(promise,ms)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Upload timed out. Check the dashboard before retrying.')),ms)})]).finally(()=>clearTimeout(timer))};
function Action({title,onPress,outline=false,disabled=false}){return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.action,outline&&s.outline,disabled&&{opacity:.45}]}><Text style={[s.actionText,outline&&{color:INK}]}>{title}</Text></TouchableOpacity>}
function ProximityArt({choice}){
 // Fixed wire at y=66. Only canopy geometry changes vertically, so the gap
 // is measured to the CONDUCTOR, never to the pole. Schematic, not to scale.
 const config={
  touching:{top:55,label:'CONTACT',accent:'#db3737',arrow:false},
  within:{top:103,label:'Near the wire',accent:'#bb7800',arrow:true},
  growing:{top:151,label:'Clear gap',accent:'#167d50',arrow:true}
 }[choice]||{top:151,label:'Clear gap',accent:'#167d50',arrow:true};
 const y=config.top, wireY=66, canopyTop=y+2;
 // Top edge of canopy is 9 px above the wire only in touching mode.
 const arrowX=212;
 return <View style={s.diagram} accessible accessibilityLabel={`${HAZARDS.find(h=>h.id===choice)?.title}. ${choice==='touching'?'Branches intersect the wire.':choice==='within'?'Small illustrated gap between canopy and wire.':'Large illustrated gap between canopy and wire.'} Diagram is not to scale.`}>
  <Svg viewBox="0 0 360 245" width="100%" height="100%">
   <Rect width="360" height="245" fill="#e7f5ff"/>
   <Path d="M0 218 Q95 209 174 218 T360 217 L360 245 L0 245Z" fill="#bcd6bd"/>
   <Path d="M0 231 Q90 222 180 230 T360 229" stroke="#88b18e" strokeWidth="4" fill="none"/>
   {/* Pole is separate from the distance reference */}
   <Rect x="310" y="40" width="13" height="180" rx="2" fill="#77523b"/>
   <Rect x="273" y="55" width="88" height="8" rx="2" fill="#604534"/>
   <Circle cx="284" cy="53" r="5" fill="#a9b9bd" stroke="#47545b" strokeWidth="2"/>
   <Circle cx="349" cy="53" r="5" fill="#a9b9bd" stroke="#47545b" strokeWidth="2"/>
   {/* The wire is the continuous dark path at y=66 */}
   <Path d="M0 66 Q110 70 205 66 T360 65" fill="none" stroke="#24343b" strokeWidth="3.5"/>
   {/* Canopy is drawn with explicit different top edges for the 3 states */}
   <Rect x="79" y={y+49} width="14" height={Math.max(10,218-(y+49))} fill="#866044"/>
   <G>
    <Ellipse cx="80" cy={y+39} rx="69" ry="36" fill="#387a49"/>
    <Ellipse cx="42" cy={y+39} rx="35" ry="31" fill="#4a9657"/>
    <Ellipse cx="74" cy={y+26} rx="43" ry="24" fill="#4f9c5a"/>
    <Ellipse cx="116" cy={y+40} rx="32" ry="28" fill="#438c50"/>
    <Ellipse cx="71" cy={y+11} rx="24" ry="10" fill="#60aa63"/>
    <Circle cx="39" cy={y+33} r="8" fill="#6ab36c"/>
    <Circle cx="107" cy={y+23} r="8" fill="#69b16b"/>
   </G>
   {choice==='touching'?<G>
     <Circle cx="123" cy="67" r="17" stroke="#dc3636" strokeWidth="2.5" fill="none"/>
     <Line x1="143" y1="45" x2="151" y2="35" stroke="#dc3636" strokeWidth="3"/>
     <Line x1="151" y1="61" x2="162" y2="59" stroke="#dc3636" strokeWidth="3"/>
     <Rect x="178" y="84" width="111" height="27" rx="7" fill="#dc3636"/>
     <SvgText x="233" y="102" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white">CONTACT</SvgText>
   </G>:<G>
     {/* Two dotted horizontal witness lines show canopy-to-wire measurement */}
     <Line x1="171" y1={wireY} x2="244" y2={wireY} stroke={config.accent} strokeWidth="1.6" strokeDasharray="5,4"/>
     <Line x1="171" y1={canopyTop} x2="244" y2={canopyTop} stroke={config.accent} strokeWidth="1.6" strokeDasharray="5,4"/>
     <Line x1={arrowX} y1={wireY+7} x2={arrowX} y2={canopyTop-7} stroke={config.accent} strokeWidth="2.6"/>
     <Polygon points={`${arrowX-6},${wireY+8} ${arrowX+6},${wireY+8} ${arrowX},${wireY}`} fill={config.accent}/>
     <Polygon points={`${arrowX-6},${canopyTop-8} ${arrowX+6},${canopyTop-8} ${arrowX},${canopyTop}`} fill={config.accent}/>
     <Rect x="238" y={(wireY+canopyTop)/2-14} width="111" height="28" rx="7" fill="white" opacity="0.94"/>
     <SvgText x="293" y={(wireY+canopyTop)/2+5} textAnchor="middle" fontSize="12" fontWeight="bold" fill={config.accent}>{choice==='within'?'NEAR WIRE':'FARTHER AWAY'}</SvgText>
   </G>}
  </Svg>
  <Text style={s.diagramNote}>Schematic only · gap is canopy to wire · not to scale</Text>
 </View>
}
export default function App(){
 const [editing,setEditing]=useState(null),[editLocation,setEditLocation]=useState(''),[editNotes,setEditNotes]=useState('');
  const [tab,setTab]=useState('Report'),[choice,setChoice]=useState('growing'),[photo,setPhoto]=useState(null),[coords,setCoords]=useState(null),[landmark,setLandmark]=useState(''),[notes,setNotes]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState([]),[last,setLast]=useState(null);
 useEffect(()=>{AsyncStorage.getItem('gridlens_history').then(x=>{if(x)setHistory(JSON.parse(x))}).catch(()=>{})},[]);
 const pick=async(camera)=>{try{const p=camera?await ImagePicker.requestCameraPermissionsAsync():await ImagePicker.requestMediaLibraryPermissionsAsync();if(!p.granted)return Alert.alert('Permission required','Please allow camera or photo-library access.');const r=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.7}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.7});if(!r.canceled)setPhoto(r.assets[0])}catch(e){Alert.alert('Photo error',String(e))}};
 const gps=async()=>{try{const p=await Location.requestForegroundPermissionsAsync();if(!p.granted)return Alert.alert('Location required','Allow location access to attach coordinates.');const x=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});setCoords({lat:x.coords.latitude,lon:x.coords.longitude})}catch(e){Alert.alert('GPS error',String(e))}};
 const submit=async()=>{
  if(busy)return;
  if(!photo||!coords)return Alert.alert('Before you submit','Add a photo and capture your GPS location.');
  setBusy(true);
  try{
   const selected=HAZARDS.find(x=>x.id===choice);
   // The existing backend accepts notes but not a separate hazard-selection field.
   // Prefixing notes preserves the selection on the City Dashboard without schema changes.
   const reportNotes=`Citizen proximity observation: ${selected.title} (unverified).${notes.trim()?`\n${notes.trim()}`:''}`;
   const upload=FileSystem.uploadAsync(API_URL+'/api/reports',photo.uri,{httpMethod:'POST',uploadType:FileSystem.FileSystemUploadType.MULTIPART,fieldName:'photo',mimeType:photo.mimeType||'image/jpeg',parameters:{lat:String(coords.lat),lon:String(coords.lon),location:landmark,notes:reportNotes}});
   const res=await timeout(upload,120000);
   let data;try{data=JSON.parse(res.body)}catch{throw new Error(`Invalid server response (HTTP ${res.status})`)}
   if(res.status<200||res.status>=300)throw new Error(`HTTP ${res.status}: ${JSON.stringify(data.detail||data)}`);
   const record={id:data.id,created_at:data.created_at,location:landmark,notes:reportNotes,choice,screening:data.screening,owner_token:data.owner_token};
   const updated=[record,...history];setHistory(updated);await AsyncStorage.setItem('gridlens_history',JSON.stringify(updated)).catch(()=>{});
   setLast(data);setPhoto(null);setCoords(null);setNotes('');setLandmark('');
   Alert.alert('Report received','Your observation was saved to the GridLens demo dashboard. It has not been sent to a utility.');
  }catch(e){Alert.alert('Submission failed',String(e?.message||e))}finally{setBusy(false)}
 };
   const saveEdit=async()=>{
   if(!editing||busy)return;
   setBusy(true);
   try{
    const res=await fetch(API_URL+'/api/reports/'+encodeURIComponent(editing.id)+'/details',{
     method:'PATCH',headers:{'Content-Type':'application/json','X-Report-Token':editing.owner_token},
     body:JSON.stringify({location:editLocation,notes:editNotes})
    });
    if(!res.ok)throw new Error('HTTP '+res.status+': '+await res.text());
    const updated=history.map(r=>r.id===editing.id?{...r,location:editLocation,notes:editNotes}:r);
    await AsyncStorage.setItem('gridlens_history',JSON.stringify(updated));
    setHistory(updated);setEditing(null);
    Alert.alert('Saved','Report updated on the central dashboard.');
   }catch(e){Alert.alert('Edit failed',String(e.message||e))}
   finally{setBusy(false)}
  };
  const deleteReport=r=>{
   if(busy)return;
   Alert.alert('Delete report permanently?','This removes the report from the central GridLens dashboard and cannot be undone.',[
    {text:'Cancel',style:'cancel'},
    {text:'Delete permanently',style:'destructive',onPress:async()=>{
     setBusy(true);
     try{
      const res=await fetch(API_URL+'/api/reports/'+encodeURIComponent(r.id),{
       method:'DELETE',headers:{'X-Report-Token':r.owner_token}
      });
      if(!res.ok)throw new Error('HTTP '+res.status+': '+await res.text());
      const updated=history.filter(x=>x.id!==r.id);
      await AsyncStorage.setItem('gridlens_history',JSON.stringify(updated));
      setHistory(updated);setEditing(null);
      Alert.alert('Deleted','Report permanently removed from the central dashboard.');
     }catch(e){Alert.alert('Delete failed',String(e.message||e))}
     finally{setBusy(false)}
    }}
   ]);
  };
  return <SafeAreaView style={s.root}><StatusBar barStyle="dark-content" backgroundColor={BG}/>
  <View style={s.emergency}><Text style={s.emergencyText}>Line down, sparking, or fire? Stay 35 feet away and call 911.</Text></View>
  <View style={s.header}><View style={s.logoDot}/><View style={s.brandStack}><Text style={s.brand}>GridLens</Text><Text style={s.tagline}>See the Risk. Protect the Grid.</Text></View><Text style={s.headerSide}>AUSTIN · DEMO</Text></View>
  <View style={s.nav}>{['Report','My reports','Heat map','More'].map(t=><TouchableOpacity key={t} accessibilityRole="tab" accessibilityState={{selected:tab===t}} onPress={()=>setTab(t)} style={[s.navItem,tab===t&&s.navActive]}><Text style={[s.navLabel,tab===t&&s.navLabelActive]}>{t}</Text></TouchableOpacity>)}</View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
   {tab==='Report'?<>
    <Text style={s.hero}>See a tree on a power line?</Text><Text style={s.heroSub}>Report it in seconds.</Text>
    <Text style={s.intro}>Help keep Austin’s power grid safer. Share a photo and location so potential hazards can be reviewed.</Text>
    <View style={s.section}><Text style={s.sectionTitle}>How close is the tree to the line?</Text><ProximityArt choice={choice}/>
     {HAZARDS.map(h=><TouchableOpacity key={h.id} accessibilityRole="radio" accessibilityState={{checked:choice===h.id}} onPress={()=>setChoice(h.id)} style={[s.option,choice===h.id&&s.optionSelected]}><View style={[s.radio,choice===h.id&&s.radioSelected]}>{choice===h.id&&<View style={s.radioFill}/>}</View><View style={{flex:1}}><Text style={s.optionTitle}>{h.title}</Text><Text style={s.optionDescription}>{h.description}</Text></View></TouchableOpacity>)}
     <Text style={s.hint}>Your selection describes what you see; it is not an AI finding or verified distance.</Text>
    </View>
    <View style={s.section}><Text style={s.sectionTitle}>1. Add a photo</Text><Text style={s.small}>Take a photo from a safe location. Never approach or touch a power line.</Text><View style={s.actions}><Action title="Take photo" onPress={()=>pick(true)}/><Action title="Choose photo" outline onPress={()=>pick(false)}/></View>{photo&&<Image source={{uri:photo.uri}} style={s.photo}/>}</View>
    <View style={s.section}><Text style={s.sectionTitle}>2. Add the location</Text><Action title={coords?'✓ Location captured':'Capture GPS location'} outline onPress={gps}/>{coords&&<Text style={s.small}>{coords.lat.toFixed(6)}, {coords.lon.toFixed(6)}</Text>}<TextInput style={s.input} placeholder="Street or nearby landmark (optional)" placeholderTextColor="#7b8586" value={landmark} onChangeText={setLandmark}/><TextInput style={[s.input,{height:84,textAlignVertical:'top'}]} multiline placeholder="Additional details (optional)" placeholderTextColor="#7b8586" value={notes} onChangeText={setNotes}/></View>
    <View style={s.section}><Text style={s.sectionTitle}>3. Submit for review</Text><Text style={s.small}>AI screening is experimental. It cannot confirm electrical clearance or dispatch utility crews.</Text><Action title={busy?'Processing…':'Submit report'} disabled={busy} onPress={submit}/>{busy&&<ActivityIndicator color={GREEN} style={{marginTop:12}}/>}{last&&<View style={s.result}><Text style={s.resultTitle}>Latest report · {last.id}</Text></View>}</View>
   </>:tab==='My reports'?<View style={s.section}><Text style={s.sectionTitle}>My reports</Text>{history.length?history.map((r,i)=><View key={r.id||i} style={s.historyRow}><Text style={s.optionTitle}>{r.location||'GPS observation'}</Text><Text style={s.small}>{r.created_at?new Date(r.created_at).toLocaleString():''}</Text><Text style={s.small}>Citizen observation: {HAZARDS.find(h=>h.id===r.choice)?.title||'Not recorded'}</Text>{r.owner_token?<View style={s.actions}><Action title="Edit" outline disabled={busy} onPress={()=>{setEditing(r);setEditLocation(r.location||'');setEditNotes(r.notes||'')}}/><Action title="Delete" disabled={busy} onPress={()=>deleteReport(r)}/></View>:<Text style={s.hint}>Older report: editing and deletion unavailable because no ownership token was issued.</Text>}{editing?.id===r.id&&<View><TextInput style={s.input} value={editLocation} onChangeText={setEditLocation} placeholder="Location"/><TextInput style={[s.input,{height:90}]} multiline value={editNotes} onChangeText={setEditNotes} placeholder="Notes"/><View style={s.actions}><Action title="Save changes" disabled={busy} onPress={saveEdit}/><Action title="Cancel" outline onPress={()=>setEditing(null)}/></View></View>}</View>):<Text style={s.small}>No reports submitted yet.</Text>}</View>
   :tab==='Heat map'?<View style={s.section}><Text style={s.sectionTitle}>Austin report map</Text><Text style={s.small}>View submitted observations on the live GridLens dashboard:</Text><TouchableOpacity accessibilityRole="link" onPress={()=>Linking.openURL(API_URL)}><Text style={s.url}>{API_URL}</Text><Text style={s.small}>Tap to open live map ↗</Text></TouchableOpacity><Text style={s.small}>The live map opens in your browser. Reports are not sent to Austin Energy.</Text></View>
   :<View style={s.section}><Text style={s.sectionTitle}>Why it matters</Text><Text style={s.small}>Vegetation near overhead lines can contribute to outages. Community observations can help identify locations for professional review.</Text><Text style={[s.sectionTitle,{marginTop:18}]}>How it works</Text><Text style={s.small}>Choose the illustrated proximity, take a photo, capture GPS, and submit. The AI returns a preliminary screening result to your demo dashboard.</Text><Text style={[s.sectionTitle,{marginTop:18}]}>Utility desk</Text><Text style={s.small}>The dashboard is a local demonstration and is not connected to utility dispatch.</Text></View>}
   <Text style={s.footer}>GRID LENS · COMMUNITY INFRASTRUCTURE WATCH · DEMO</Text>
  </ScrollView>
 </SafeAreaView>
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:BG},emergency:{backgroundColor:'#fff4d5',paddingHorizontal:16,paddingVertical:9},emergencyText:{color:'#634c17',fontSize:11,fontWeight:'700',textAlign:'center'},header:{minHeight:72,paddingHorizontal:20,flexDirection:'row',alignItems:'center'},logoDot:{height:15,width:15,borderRadius:8,borderWidth:4,borderColor:INK,marginRight:9},brandStack:{flexShrink:1,justifyContent:'center'},tagline:{fontSize:11,color:MUTED,fontWeight:'600',marginTop:2},brand:{fontSize:23,fontWeight:'900',color:INK,letterSpacing:-.8},headerSide:{marginLeft:'auto',paddingLeft:8,fontSize:10,color:MUTED,fontWeight:'700',letterSpacing:1},nav:{flexDirection:'row',borderBottomWidth:1,borderColor:'#deded7',paddingHorizontal:12},navItem:{flex:1,alignItems:'center',paddingVertical:13,borderBottomWidth:3,borderColor:'transparent'},navActive:{borderColor:GOLD},navLabel:{fontSize:12,color:MUTED,fontWeight:'700'},navLabelActive:{color:INK},scroll:{paddingHorizontal:18,paddingTop:23,paddingBottom:42},hero:{fontSize:31,fontWeight:'900',color:INK,letterSpacing:-1.1,lineHeight:36},heroSub:{fontSize:28,fontWeight:'900',color:INK,letterSpacing:-.9,marginTop:1},intro:{fontSize:14,color:MUTED,lineHeight:22,marginTop:11,marginBottom:18},section:{paddingTop:17,paddingBottom:18,borderTopWidth:1,borderColor:'#e7e7e0',marginBottom:9},sectionTitle:{fontSize:18,fontWeight:'900',color:INK,marginBottom:13},small:{fontSize:13,lineHeight:20,color:MUTED,marginBottom:10},hint:{fontSize:11,color:MUTED,lineHeight:17,marginTop:10},diagram:{height:235,backgroundColor:'#f5f7f3',borderRadius:12,overflow:'hidden',marginBottom:13,position:'relative'},diagramTitle:{textAlign:'center',fontSize:16,fontWeight:'900',color:INK,marginTop:10,zIndex:4},wire:{position:'absolute',height:3,backgroundColor:INK,left:'7%',right:'7%',top:78,transform:[{rotate:'-2deg'}],zIndex:2},wireEnd:{position:'absolute',height:3,backgroundColor:INK,right:0,width:'20%',top:82,transform:[{rotate:'7deg'}],zIndex:2},pole:{position:'absolute',height:126,width:12,backgroundColor:INK,right:'21%',top:61,zIndex:1},crossarm:{position:'absolute',height:8,width:73,backgroundColor:INK,right:'12%',top:70,zIndex:3},ground:{position:'absolute',bottom:23,left:15,right:15,height:12,backgroundColor:'#bed1c0'},tree:{position:'absolute',top:66,width:120,height:122,zIndex:3},canopyOne:{position:'absolute',top:0,left:6,width:82,height:85,borderRadius:44,backgroundColor:GREEN},canopyTwo:{position:'absolute',top:22,left:46,width:67,height:65,borderRadius:36,backgroundColor:GREEN},canopyThree:{position:'absolute',top:31,left:0,width:69,height:58,borderRadius:32,backgroundColor:GREEN},trunk:{position:'absolute',bottom:0,left:45,width:16,height:44,backgroundColor:'#89613e',zIndex:-1},diagramNote:{position:'absolute',bottom:4,right:13,fontSize:9,color:MUTED},option:{borderWidth:1.5,borderColor:'#dedfd8',borderRadius:10,padding:13,marginBottom:9,flexDirection:'row',alignItems:'center',backgroundColor:'#fff'},optionSelected:{borderColor:INK,borderWidth:2,backgroundColor:'#fffdf4',shadowColor:GOLD,shadowOpacity:.8,shadowOffset:{width:3,height:4},shadowRadius:0,elevation:2},radio:{width:19,height:19,borderRadius:10,borderWidth:1.5,borderColor:'#a6aca9',marginRight:12,alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:INK},radioFill:{width:9,height:9,borderRadius:5,backgroundColor:INK},optionTitle:{fontSize:14,fontWeight:'800',color:INK},optionDescription:{fontSize:12,color:MUTED,lineHeight:18,marginTop:3},actions:{flexDirection:'row',gap:9},action:{backgroundColor:INK,borderRadius:9,paddingVertical:14,paddingHorizontal:14,alignItems:'center',justifyContent:'center',flex:1,marginVertical:6},outline:{backgroundColor:'#fff',borderWidth:1.5,borderColor:INK},actionText:{color:'#fff',fontSize:13,fontWeight:'800'},input:{borderWidth:1,borderColor:'#d8dad4',borderRadius:9,padding:13,fontSize:14,color:INK,backgroundColor:'#fff',marginTop:10},photo:{width:'100%',height:200,resizeMode:'contain',backgroundColor:'#eff1ee',borderRadius:10,marginTop:10},result:{backgroundColor:'#f1f5ed',borderRadius:10,padding:13,marginTop:14},resultTitle:{fontWeight:'800',color:INK,marginBottom:7},historyRow:{borderBottomWidth:1,borderColor:'#e2e4dd',paddingVertical:14},url:{fontSize:14,fontWeight:'700',color:GREEN,marginVertical:8},footer:{fontSize:9,color:'#9ba29f',textAlign:'center',marginTop:18,letterSpacing:1}
});
