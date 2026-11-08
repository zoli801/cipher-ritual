export class Soundscape {
  constructor() { this.enabled = true; this.ctx = null; this.master = null; }
  async unlock() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = .29; this.master.connect(this.ctx.destination);
        this.startAtmosphere();
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch { this.enabled = false; }
  }
  setEnabled(value) {
    this.enabled = value;
    if (this.master) this.master.gain.setTargetAtTime(value ? .29 : 0, this.ctx.currentTime, .2);
    if (value) this.unlock();
  }
  startAtmosphere() {
    for (const [freq, vol] of [[48, .15], [72.1, .055], [96.15, .035]]) {
      const osc = this.ctx.createOscillator(), amp = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq; amp.gain.value = vol;
      osc.connect(amp); amp.connect(this.master); osc.start();
      const lfo = this.ctx.createOscillator(), lfoAmp = this.ctx.createGain();
      lfo.frequency.value = .12; lfoAmp.gain.value = .018; lfo.connect(lfoAmp); lfoAmp.connect(amp.gain); lfo.start();
    }
  }
  tone(freq, duration = .5, volume = .2, type = 'sine', end = freq) {
    if (!this.enabled || !this.ctx) return;
    const t=this.ctx.currentTime, o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(12,end),t+duration);
    g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.1);
  }
  noise(duration, volume = .3, lowpass = 2000, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t=this.ctx.currentTime+delay, b=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate),data=b.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,.7);
    const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=lowpass;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);
  }
  lighter(){this.noise(.14,.5,7000);this.tone(180,.14,.03,'triangle',90);}
  candle(index){this.noise(.4,.13,1800);this.tone(230*Math.pow(2,index/12),1.2,.1,'sine');}
  page(){this.noise(.48,.17,3600);}
  portal(){this.noise(4.5,.42,1100);this.tone(68,5,.35,'sawtooth',220);this.tone(900,4,.06,'sine',60);}
  deal(){this.noise(1.4,.5,2400);this.tone(440,2.3,.12,'sine',55);this.tone(65,3,.4,'triangle',28);}
  collapse(){for(let i=0;i<7;i++)this.noise(2.4,.5,400+i*130,i*.46);this.tone(45,5,.6,'sawtooth',19);}
  laugh(){
    if(!this.enabled||!this.ctx)return;
    const now=this.ctx.currentTime;
    for(let i=0;i<10;i++){
      const o=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter(),t=now+i*.19;
      o.type='sawtooth';o.frequency.setValueAtTime(170+(i%3)*24,t);o.frequency.exponentialRampToValueAtTime(80+i*3,t+.17);
      f.type='bandpass';f.frequency.value=650+(i%2)*300;f.Q.value=3;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.25,t+.035);g.gain.exponentialRampToValueAtTime(.001,t+.17);
      o.connect(f);f.connect(g);g.connect(this.master);o.start(t);o.stop(t+.18);
    }
  }
  reveal(){for(const f of [110,165,220,330])this.tone(f,3,.13,'sine');}
}
