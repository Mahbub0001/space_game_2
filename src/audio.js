export class FlightAudio {
  constructor(){
    this.muted=false;this.voice=true;this.ctx=null;this.lastWarning=0;this.musicTime=0;this.lastProximity=0;
    this.klaxonActive=false;
    this.klaxonTimer=null;
    this.windSource=null;
    this.windFilter=null;
    this.windGain=null;
  }
  async start(){
    if(this.ctx){await this.ctx.resume();return;}
    try{
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.5;this.master.connect(this.ctx.destination);
      this.engine=this.ctx.createOscillator();this.engine.type='sawtooth';this.engine.frequency.value=48;
      this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=160;
      this.engineGain=this.ctx.createGain();this.engineGain.gain.value=.025;
      this.engine.connect(this.filter);this.filter.connect(this.engineGain);this.enginePan=this.ctx.createStereoPanner();this.engineGain.connect(this.enginePan);this.enginePan.connect(this.master);this.engine.start();
      this.drone=this.ctx.createOscillator();this.drone.frequency.value=55;this.droneGain=this.ctx.createGain();this.droneGain.gain.value=.08;
      this.drone.connect(this.droneGain);this.droneGain.connect(this.master);this.drone.start();
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);const d=buffer.getChannelData(0);let last=0;
      for(let i=0;i<d.length;i++){last=(last+Math.random()*.04-.02)/1.02;d[i]=last*3;}
      this.noise=this.ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
      this.noiseGain=this.ctx.createGain();this.noiseGain.gain.value=.02;this.noise.connect(this.noiseGain);this.noiseGain.connect(this.master);this.noise.start();
    }catch(error){console.warn('Audio unavailable:',error.message);}
  }
  toggle(){
    this.muted=!this.muted;
    if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.5,this.ctx.currentTime,.1);
    if(this.muted){
      this.stopKlaxon();
      if(this.windGain){
        this.windGain.gain.value=0;
        if(this.ctx)this.windGain.gain.setTargetAtTime(0,this.ctx.currentTime,.1);
      }
      if(typeof window!=='undefined')window.speechSynthesis?.cancel();
    }
    return !this.muted;
  }
  startKlaxon(){
    if(this.muted||this.klaxonActive||!this.ctx)return;
    this.klaxonActive=true;
    this.klaxonTimer=setInterval(()=>{
      if(!this.klaxonActive||this.muted)return;
      this.tone(880,0.22,'sawtooth',0.12);
      setTimeout(()=>{
        if(this.klaxonActive&&!this.muted){
          this.tone(660,0.22,'sawtooth',0.12);
        }
      },280);
    },600);
  }
  stopKlaxon(){
    this.klaxonActive=false;
    if(this.klaxonTimer){
      clearInterval(this.klaxonTimer);
      this.klaxonTimer=null;
    }
  }
  initWind(){
    if(!this.ctx||this.windSource)return;
    const bufferSize=this.ctx.sampleRate*2;
    const buffer=this.ctx.createBuffer(1,bufferSize,this.ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      data[i]=(Math.random()*2-1)*0.3;
    }
    this.windSource=this.ctx.createBufferSource();
    this.windSource.buffer=buffer;
    this.windSource.loop=true;
    this.windFilter=this.ctx.createBiquadFilter();
    this.windFilter.type='bandpass';
    this.windFilter.frequency.value=240;
    this.windFilter.Q.value=3.5;
    this.windGain=this.ctx.createGain();
    this.windGain.gain.value=0;
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.master);
    this.windSource.start();
  }
  updateWind(intensity){
    if(this.muted||!this.ctx)return;
    if(!this.windSource)this.initWind();
    if(this.windGain){
      const targetGain=this.muted?0:Math.max(0,Math.min(0.4,intensity*0.35));
      this.windGain.gain.setTargetAtTime(targetGain,this.ctx.currentTime,0.1);
    }
    if(this.windFilter){
      const targetFreq=180+intensity*350;
      this.windFilter.frequency.setTargetAtTime(targetFreq,this.ctx.currentTime,0.15);
    }
  }
  tone(frequency=600,duration=.12,type='sine',volume=.13,slide=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,frequency+slide),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);}
  impact(amount=16){
    if(!this.ctx||this.muted)return;
    const ctx=this.ctx,t=ctx.currentTime,strength=Math.max(.35,Math.min(1,amount/24));
    // A cabin-transmitted thud, followed by the hull's metallic vibration.
    this.tone(105,.55,'sine',.42*strength,-76);
    this.tone(235,.26,'triangle',.17*strength,-130);
    const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.48),ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(2600,t);filter.frequency.exponentialRampToValueAtTime(180,t+.45);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.5*strength,t+.004);gain.gain.exponentialRampToValueAtTime(.001,t+.46);
    source.connect(filter);filter.connect(gain);gain.connect(this.master);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(t);source.stop(t+.48);
  }
  cue(name){
    if(name==='click')this.tone(950,.05,'sine',.07,-220);
    if(name==='scan')this.tone(510,.2,'sine',.1,520);
    if(name==='success'){[440,554,660,880].forEach((f,i)=>setTimeout(()=>this.tone(f,.45,'sine',.09),i*100));}
    if(name==='impact')this.impact();
    if(name==='alert'){this.tone(580,.15,'square',.06);setTimeout(()=>this.tone(420,.25,'square',.05),180);}
    if(name==='transition'){this.tone(80,2.2,'sine',.2,850);}
  }
  speak(text){
    if(this.muted||!this.voice||!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();const message=new SpeechSynthesisUtterance(text);message.rate=.97;message.pitch=.86;message.volume=.7;
    const voices=window.speechSynthesis.getVoices();message.voice=voices.find(v=>v.lang==='en-US'&&/David|Guy|Mark|Google US/.test(v.name))||voices.find(v=>v.lang==='en-US')||null;
    window.speechSynthesis.speak(message);
  }
  stopVoice(){window.speechSynthesis?.cancel();}
  update(dt,sim){
    if(!this.ctx)return;
    const moving=sim?.mode==='flight';const speed=moving?sim.speed:2;const t=this.ctx.currentTime;
    this.engine.frequency.setTargetAtTime(35+speed*.9,t,.12);this.filter.frequency.setTargetAtTime(95+speed*5,t,.15);
    const throttle=moving?(sim.isSurface?Math.min(speed/19,1):(sim.throttle||0)):0;
    this.engineGain.gain.setTargetAtTime(.008+throttle*.06,t,.2);this.enginePan.pan.setTargetAtTime(moving?Math.max(-.6,Math.min(.6,sim.velocity.x/25)):0,t,.1);this.noiseGain.gain.setTargetAtTime(moving?.035+speed*.002:.012,t,.15);
    if(moving&&[3,5].includes(sim.stage)&&sim.range<150&&t-this.lastProximity>Math.max(.3,sim.range/100)){this.lastProximity=t;this.tone(sim.canInteract?880:sim.speed>10?300:600,.055,'sine',.035);}
    this.musicTime+=dt;
    if(this.musicTime>5.5){this.musicTime=0;const notes=[110,164.81,220,261.63,329.63];this.tone(notes[Math.floor(Math.random()*notes.length)],3.5,'sine',.026);}
    if(moving&&sim.hull<30&&t-this.lastWarning>4){this.lastWarning=t;this.cue('alert');}
  }
}
