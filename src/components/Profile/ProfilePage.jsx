import React,{useState}from 'react';
import { Award, BookOpen, Briefcase, Eye, HelpCircle, Lock, Play, Settings } from 'lucide-react';
import './profile.css';

const tiers=[['SULTAN','1.500 Lot','IPhone 17 Pro Max','future'],['ELITE','1.000 Lot','$1,000 Cash','future'],['PRIME','500 Lot','Samsung Galaxy A55','active'],['TRADER','50 Lot','Merchandise NH','done'],['INACTIVE','0 Lot','-','done']];
const videos=['INTRODUCTION TO TRADING','MARKET STRUCTURE','SUPPLY & DEMAND','FIBONACCI STRATEGY','BEHIND THE CANDLESTICK','BASIC OF NEWS TRADING'];

function TierRoadmap(){return <div className="tier-roadmap">{tiers.map(([name,lot,reward,state])=><div className={`tier-step ${state}`} key={name}><i/><b>{name}</b><span><em>{lot}</em><u/>{reward}</span></div>)}</div>}
function VideoCard({title,index}){const locked=index>2;const[playing,setPlaying]=useState(false);return <article className={`education-card ${locked?'locked':''}`} onClick={()=>locked?window.alert('Upgrade your tier to unlock this lesson.'):setPlaying(!playing)}><h3><b>{index}.</b> {title}</h3><div className="video-screen">{locked?<div><span><Lock/></span><strong>Premium</strong></div>:playing?<strong>Playing demo lesson…</strong>:<Play/>}</div><footer><span>NH TECHNICAL - 12:30</span><span><Eye/>1.2K Views</span></footer></article>}

export default function ProfilePage(){return <div className="profile-page">
  <section className="profile-summary"><div className="profile-identity"><div className="profile-avatar">NH</div><div><h1>NAUFAL H.</h1><p>@Naufalh - IB 380359</p><b>PRIME</b></div></div><div className="profile-progress"><div><span>Progress Ke - <b>ELITE</b></span><strong>734 / 1,000 Lot</strong></div><div className="progress-track"><i/></div><small>266 Lot Lagi Ke ELITE</small><nav><button><Award/>Reward Program</button><button><BookOpen/>Edukasi</button><button><Settings/>Pengaturan</button><button><HelpCircle/>Bantuan</button></nav></div></section>
  <section className="rewards"><div><h2>REWARD TIERS</h2><TierRoadmap/></div><div><h2>REWARD TIERS</h2><div className="reward-stats"><article><span>Current Tier</span><b>PRIME</b></article><article><span>Total Lot</span><b>734 LOT</b></article><article><span>Progress</span><b>73.4%</b></article><article><span>Member Since</span><b>JULY 2026</b></article></div></div></section>
  <section className="education"><h2>VIDEO EDUKASI</h2><div>{videos.map((x,i)=><VideoCard title={x} index={i+1} key={x}/>)}</div></section>
 </div>}
