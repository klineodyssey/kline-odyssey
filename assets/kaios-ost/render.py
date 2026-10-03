"""Offline first-party KAIOS score + synthesizer. Not a game/runtime authority.
No audio input, network, model, credentials, sample pack or external melody.
Run: python assets/kaios-ost/render.py (requires NumPy).
Eight full PCM masters go to artifacts; game loops and scores go beside this tool.
"""
from pathlib import Path
import hashlib, json, math, sys, wave, struct
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / 'artifacts/kaios-ost-render-deps'))
try:
    import lameenc
except ImportError:
    lameenc = None
SR = 44100
TAU = 2 * np.pi
TRACKS = [
    dict(id='11520_THEME', file='01-huaguoshan-battle-song', title='花果山戰歌 · 雲起金箍', world='K11520', bpm=112, bars=32, mode='dorian', style='journey', seed=11520,
         structure='0–4 引子 / 4–12 取經主題 / 12–20 戰鬥推進 / 20–28 英雄再現 / 28–32 收束',
         instruments='合成竹笛、撥弦、弦樂墊底、低鼓、金屬泛音、未來脈衝'),
    dict(id='12345_THEME', file='02-heart-light', title='心光 · 願火長明', world='K12345', bpm=80, bars=24, mode='major', style='heart', seed=12345,
         structure='0–4 心跳 / 4–12 祈願 / 12–20 溫暖回應 / 20–24 安歇',
         instruments='合成柔音鍵盤、玻璃鐘、暖弦、低頻雙心跳'),
    dict(id='16888_THEME', file='03-sea-of-stars', title='星海 · 文明遠航', world='K16888', bpm=76, bars=24, mode='lydian', style='space', seed=16888,
         structure='0–4 星門 / 4–12 航行 / 12–20 星群 / 20–24 遠方',
         instruments='空間合成墊、星點琶音、低頻引擎、延遲鐘聲；無商業音源'),
    dict(id='BOSS_THEME', file='04-six-phase-titan', title='六相天劫 · 破界', world='K11520 / BOSS', bpm=136, bars=24, mode='minor', style='boss', seed=600,
         structure='0–4 降臨 / 4–12 對峙 / 12–20 狂暴與低血量 / 20–24 終擊',
         instruments='合成低弦、銅管式音色、戰鼓、失真低音、噪聲鈸'),
    dict(id='VICTORY_THEME', file='05-dawn-after-battle', title='雲開 · 凱旋', world='SHARED / VICTORY', bpm=108, bars=8, mode='major', style='victory', seed=520,
         structure='0–2 勝利上行 / 2–6 KAIOS 主題 / 6–8 落地與餘韻',
         instruments='合成英雄銅管、弦樂、鐘、定音鼓'),
    dict(id='LEVEL_UP_MOTIF', file='06-light-of-ascent', title='升光 · 星核覺醒', world='SHARED / PLAYER + GA600', bpm=104, bars=4, mode='major', style='level', seed=290,
         structure='0–1 能量聚合 / 1–3 主音型上行 / 3–4 成長定格',
         instruments='晶體琶音、溫暖和弦、合成引擎升頻、閃光尾音'),
]

def hz(note):
    return 440 * 2 ** ((note - 69) / 12)

def smooth(x, samples):
    samples = max(1, samples)
    cumulative = np.r_[0., np.cumsum(x, dtype=np.float64)]
    return (cumulative[np.minimum(np.arange(len(x)) + 1, len(x))] -
            cumulative[np.maximum(0, np.arange(len(x)) + 1 - samples)]) / samples

class Score:
    def __init__(self, track):
        self.track, self.events = track, []
        self.beat = 60 / track['bpm']
        self.rng = np.random.default_rng(track['seed'])
        self.length = track['bars'] * 4 * self.beat + 3.5
        self.stems = {k: np.zeros((int(self.length * SR), 2), dtype=np.float32)
                      for k in ('harmony', 'melody', 'rhythm')}

    def synth(self, voice, note, duration):
        n = max(32, int(duration * SR))
        t = np.arange(n) / SR
        f = hz(note)
        phase = TAU * f * t
        attack = .015
        if voice == 'pad':
            # Gentle additive string ensemble; no recorded instruments.
            y = sum((np.sin(phase * h + .013*h*np.sin(TAU*(4.4+.07*h)*t)) +
                     .4*np.sin(phase*h*1.0016)) / (h ** 1.75) for h in range(1, 7)) / 1.6
            env = np.minimum(t/.42, 1) * np.minimum((duration-t)/.65, 1)
        elif voice == 'flute':
            vibrato = .025*np.sin(TAU*5.1*t)*np.minimum(t/.3, 1)
            y = .82*np.sin(phase+vibrato)+.14*np.sin(2*phase)+.035*np.sin(3*phase)
            y += .012*smooth(self.rng.standard_normal(n), 9)
            env = np.minimum(t/.045, 1)*np.minimum((duration-t)/.17, 1)*(.9+.1*np.cos(TAU*.9*t))
        elif voice in ('pluck', 'keys'):
            decay = .8 if voice == 'keys' else .36
            y = (np.sin(phase+.7*np.sin(phase*2)*np.exp(-t*5)) +
                 .38*np.sin(phase*2)*np.exp(-t*6)+.15*np.sin(phase*3.002)*np.exp(-t*11)) / 1.5
            env = np.minimum(t/.006, 1)*np.exp(-t/decay)*np.minimum((duration-t)/.07, 1)
        elif voice == 'bell':
            y = (np.sin(phase)*np.exp(-t/1.6)+.42*np.sin(phase*2.001)*np.exp(-t/.7)+
                 .2*np.sin(phase*3.99)*np.exp(-t/.25)) / 1.6
            env = np.minimum(t/.003, 1)*np.minimum((duration-t)/.1, 1)
        elif voice == 'brass':
            brightness = np.minimum(t/.085,1)*np.exp(-t*.35)
            y = sum(np.sin(h*phase + .014*h*np.sin(TAU*4.7*t)) * brightness**(h/4) / h**1.3 for h in range(1,9)) / 1.7
            env = np.minimum(t/.045,1)*np.minimum((duration-t)/.15,1)
        elif voice == 'bass':
            y = .78*np.sin(phase)+.18*np.sin(2*phase)+.04*np.sin(3*phase)
            env = np.minimum(t/.012, 1)*np.exp(-t/.65)*np.minimum((duration-t)/.07,1)
        elif voice in ('drum', 'heart'):
            start, end = (110, 45) if voice == 'drum' else (80, 42)
            phase = TAU*(end*t+(start-end)*.023*(1-np.exp(-t/.023)))
            y = np.sin(phase)+.09*self.rng.standard_normal(n)*np.exp(-t/.018)
            env = np.minimum(t/.002,1)*np.exp(-t/(.17 if voice=='drum' else .075))
        elif voice == 'rim':
            noise = self.rng.standard_normal(n)
            y = .55*(noise-smooth(noise,7)) + .3*np.sin(TAU*1780*t)
            env = np.minimum(t/.001,1)*np.exp(-t/.035)
        elif voice == 'shimmer':
            noise = self.rng.standard_normal(n)
            y = .3*(noise-smooth(noise,15)) + .08*np.sin(TAU*6317*t)
            env = np.minimum(t/.035,1)*np.exp(-t/.38)
        elif voice == 'rise':
            phase = TAU*f*(np.exp(t*.8)-1)/.8
            y = .65*np.sin(phase)+.2*np.sin(phase*2.001)
            env = np.minimum(t/.2,1)*np.minimum((duration-t)/.35,1)*.7
        else:
            raise ValueError(voice)
        edge = np.minimum(t/.001,1)*np.minimum((duration-t)/.008,1)
        return (y*np.maximum(env,0)*np.maximum(edge,0)).astype(np.float32)

    def add(self, voice, note, at, beats, amp, pan=0, group=None):
        group = group or ('rhythm' if voice in ('drum','rim','shimmer','heart','bass') else 'melody')
        self.events.append(dict(voice=voice, midi=note, beat=round(at,4), beats=beats, amplitude=amp, pan=pan, stem=group))
        duration = beats*self.beat
        signal = self.synth(voice,note,duration)*amp
        start = int(at*self.beat*SR)
        end = min(start+len(signal), len(self.stems[group]))
        if end <= start: return
        signal = signal[:end-start]
        p = (pan+1)*np.pi/4
        self.stems[group][start:end,0] += signal*np.cos(p)
        self.stems[group][start:end,1] += signal*np.sin(p)

def compose(track):
    s=Score(track)
    major=track['mode'] in ('major','lydian')
    third=4 if major else 3
    # New KAIOS identity cell: D E A F(#) E | D B(b) A, with an asymmetric pickup.
    cell=[(0,0,.65),(.75,2,.6),(1.5,7,.9),(2.5,third,.6),(3.25,2,.65),(4.5,0,1.25),(6,9 if track['mode']!='minor' else 8,.65),(7,7,.85)]
    answer=[(0,12,.9),(1.25,9 if major else 7,.65),(2.25,7,.75),(3.25,third,1.2),(5,2,.9),(6.25,0,1.5)]
    chords=([ [50,57,62,66,69], [47,54,59,62,66], [43,50,57,62,66], [45,52,57,61,64] ] if major else
            [ [50,57,62,65,69], [46,53,58,62,65], [48,55,60,64,67], [45,52,57,62,64] ])
    if track['mode']=='dorian': chords[1]=[43,50,57,59,62]
    if track['mode']=='lydian': chords[2]=[52,59,62,66,68]
    style=track['style'];bars=track['bars']
    for bar in range(bars):
        at=bar*4;ch=chords[(bar//2)%4]
        if bar>=bars-2:ch=chords[0]
        intro=bar<4 and bars>12
        finale=bar>=bars-4
        intensity=.55 if intro else (.85 if finale else 1)
        # Voice-led sustained harmony, one soft arpeggio and an independent bass.
        if bar%2==0:
            for k,note in enumerate(ch[1:]): s.add('pad',note,at,8.6,.058*intensity,(-.5,-.15,.2,.55)[k], 'harmony')
        bassVoice='bass'
        s.add(bassVoice,ch[0]-12,at,2.2,.17*intensity,0)
        if style not in ('heart','space'):
            s.add('bass',ch[0]-12,at+2,1.7,.13*intensity,0)
        steps=8 if style in ('journey','boss','level') else 4
        for j in range(steps):
            if intro and j%2:continue
            note=ch[1+(j%4)]+(12 if style=='space' else 0)
            s.add('bell' if style=='space' else 'pluck' if style=='journey' else 'keys',note,at+j*4/steps,1.6,.068*intensity if style!='space' else .038, .45 if j%2 else -.45)
        if style in ('journey','boss','victory'):
            for beat,amp in [(0,.26),(2,.2)]:s.add('drum',38,at+beat,.75,amp*intensity)
            if not intro:
                for beat in [1,3]:s.add('rim',75,at+beat,.25,.075)
                for beat in [.5,1.5,2.5,3.5]:s.add('shimmer',80,at+beat,.25,.04,-.3)
            if style=='boss' and bar>=12:
                for beat in [1.5,2.75,3.5]:s.add('drum',38,at+beat,.5,.16)
            if bar%4==0:s.add('shimmer',80,at,2,.09,.25)
        elif style=='heart':
            for beat in [0,2]:
                s.add('heart',32,at+beat,.45,.115)
                s.add('heart',32,at+beat+.32,.35,.065)
        elif style=='space' and bar%4==0:
            s.add('rise',26,at,3,.035,0,'harmony')
        elif style=='level':
            if bar==0:s.add('rise',38,0,3.8,.11,0,'harmony')
            s.add('shimmer',80,at,2,.07)
        # The lead is intentionally phrased; silence is part of each response.
        if bar%2==0:
            phrase=answer if (bar//2)%4==3 else cell
            voice={'journey':'flute','heart':'keys','space':'bell','boss':'brass','victory':'brass','level':'bell'}[style]
            gain={'journey':.18,'heart':.16,'space':.11,'boss':.16,'victory':.16,'level':.19}[style]
            if intro:phrase=cell[:3];gain*=.5
            for offset,note,dur in phrase:
                if at+offset>=bars*4-1:continue
                octave=12 if style=='level' else 0
                s.add(voice,62+note+octave,at+offset,dur+(1 if voice=='bell' else 0),gain,-.08)
                if style in ('journey','victory') and bar>=bars//2 and not intro:
                    s.add('brass' if style=='victory' else 'flute',62+note-12,at+offset+.015,dur,.045,.23)
        if style=='boss' and bar%4==3:
            for j in range(4):s.add('drum',35,at+3+j*.25,.4,.10+j*.025,(-.3 if j%2 else .3))
    # Intentional final tonic, not an abrupt waveform cut. Exports are previews,
    # not falsely advertised as seamless loops.
    final=(bars-1)*4
    for i,n in enumerate([62,69,74,78 if major else 77]):s.add('bell',n,final+i*.15,3,.075,(-.3+i*.2))
    return s

def finish(score):
    stems=score.stems
    dry=sum(stems.values())
    send=stems['harmony']*.5+stems['melody']*.38+stems['rhythm']*.045
    wet=np.zeros_like(dry)
    for delay,amp in [(.061,.17),(.109,.14),(.181,.13),(.293,.12),(.419,.10),(.631,.085),(.887,.063),(1.213,.04)]:
        shift=int(delay*SR)
        for ch in range(2):
            filtered=smooth(send[:,1-ch],18+int(delay*90))
            wet[shift:,ch]+=filtered[:-shift]*amp
    # Gentle nonlinear glue then fixed peak headroom; no brick-wall clipping.
    out=np.tanh((dry+wet)*.85)
    peak=float(np.max(np.abs(out)))
    out*=.78/max(peak,1e-9)
    fadeIn=int(.08*SR);fadeOut=int(2.8*SR)
    out[:fadeIn]*=np.linspace(0,1,fadeIn)[:,None]
    out[-fadeOut:]*=np.linspace(1,0,fadeOut)[:,None]**1.6
    # TPDF dither at 16-bit quantization scale.
    dither=(score.rng.random(out.shape)-score.rng.random(out.shape))/65536
    pcm=np.round(np.clip(out+dither,-.999,.999)*32767).astype('<i2')
    windows=[np.sqrt(np.mean(out[i:i+SR]**2)) for i in range(0,len(out)-SR,SR)]
    active=[x for x in windows if x>.005]
    metrics=dict(durationSeconds=round(len(out)/SR,3),sampleRate=SR,channels=2,
                 peakDbFS=round(float(20*np.log10(np.max(np.abs(out)))),2),
                 activeRmsDbFS=round(float(20*np.log10(np.mean(active))),2),
                 stereoCorrelation=round(float(np.corrcoef(out.T)[0,1]),4),
                 clippedSamples=int(np.sum(np.abs(out)>=1)),finite=bool(np.isfinite(out).all()),
                 notes=len(score.events),humanListening='PENDING_HUMAN_REVIEW',
                 loudnessNote='RMS/peak measurements; not a LUFS or speaker-listening certification')
    assert metrics['finite'] and metrics['clippedSamples']==0 and metrics['peakDbFS']<=-1.5
    assert -26<metrics['activeRmsDbFS']<-9
    return pcm,metrics

def midi_export(score, path):
    # Editable score interchange only; WAV timbres are our synthesizer, not GM recordings.
    programs={'pad':89,'flute':73,'pluck':15,'keys':4,'bell':10,'brass':61,'bass':38,'rise':95}
    channels={voice:i for i,voice in enumerate(programs)}
    def varlen(n):
        data=[n&127];n>>=7
        while n:data.insert(0,(n&127)|128);n>>=7
        return bytes(data)
    events=[(0,b'\xff\x51\x03'+round(60000000/score.track['bpm']).to_bytes(3,'big'))]
    for voice,ch in channels.items():events.append((0,bytes([0xc0+ch,programs[voice]])))
    drumNotes={'drum':41,'heart':36,'rim':37,'shimmer':49}
    for e in score.events:
        ch=channels.get(e['voice'],9);note=drumNotes.get(e['voice'],round(e['midi']))
        start=round(e['beat']*480);end=start+round(e['beats']*480)
        velocity=max(16,min(110,round(45+e['amplitude']*200)))
        events.extend([(start,bytes([0x90+ch,note,velocity])),(end,bytes([0x80+ch,note,0]))])
    events.sort(key=lambda e:e[0]);data=bytearray();previous=0
    for tick,msg in events:data+=varlen(tick-previous)+msg;previous=tick
    data+=b'\x00\xff\x2f\x00'
    path.write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,480)+b'MTrk'+struct.pack('>I',len(data))+data)

def preview_main():
    manifests=[]
    for track in TRACKS:
        score=compose(track);pcm,metrics=finish(score)
        wav=HERE/(track['file']+'.wav')
        with wave.open(str(wav),'wb') as f:
            f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(pcm.tobytes())
        files=[wav]
        midi=HERE/(track['file']+'.mid');midi_export(score,midi);files.append(midi)
        if lameenc:
            encoder=lameenc.Encoder();encoder.set_bit_rate(192);encoder.set_in_sample_rate(SR);encoder.set_channels(2);encoder.set_quality(2)
            mp3=HERE/(track['file']+'.mp3');mp3.write_bytes(encoder.encode(pcm.tobytes())+encoder.flush());files.append(mp3)
        (HERE/(track['file']+'.score.json')).write_text(json.dumps(dict(track=track,events=score.events),ensure_ascii=False,indent=2),encoding='utf-8')
        manifest=dict(TITLE=track['title'],WORLD=track['world'],ID=track['id'],
                      COMPOSER='衡曜 / Codex — AI-assisted original composition for KAIOS; Human commissioning owner: 沈英明',
                      CREATION_METHOD='Original symbolic score; deterministic additive/FM/noise synthesis and offline stereo arrangement. No human vocal recording.',
                      SOURCE_ASSETS=['render_ost.py',track['file']+'.score.json'],
                      THIRD_PARTY_MEDIA='NO',COMMERCIAL_SONG_SAMPLE='NO',GAME_USE='YES',VIDEO_USE='YES',
                      STATUS='INSTRUMENTAL_CANDIDATE_AWAITING_HUMAN_LISTENING',
                      LEGAL_NOTE='Project-intended use; not a warranty of copyright registrability or worldwide melodic uniqueness. No third-party media licenses used.',
                      bpm=track['bpm'],mode=track['mode'],structure=track['structure'],instruments=track['instruments'],
                      files=[dict(path=p.name,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files],qa=metrics)
        manifests.append(manifest)
        print(track['id'],json.dumps(metrics),flush=True)
    (HERE/'KAIOS_AUDIO_PROVENANCE.json').write_text(json.dumps(dict(tracks=manifests,productionIntegrated=False,commercialMedia=False,rendererSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),encoder='lameenc (software encoder only, not a source of audio)' if lameenc else 'PCM only'),ensure_ascii=False,indent=2),encoding='utf-8')

def game_main():
    # The six complete candidate masters remain intact. Two quieter original
    # arrangements share our identity cell, not somebody else's melody.
    tracks = TRACKS + [
        dict(TRACKS[0], id='JOURNEY_THEME', file='07-mountain-path', title='雲徑 · 取經晨行', style='heart', bpm=92, bars=24, seed=11521, structure='0–4 晨光 / 4–12 山徑 / 12–20 行旅 / 20–24 安歇', instruments='柔音合成鍵盤、暖弦墊、低頻雙脈衝、鐘聲'),
        dict(TRACKS[2], id='DEEP_SPACE_THEME', file='08-starlight-home', title='星航 · 歸途微光', style='space', mode='major', bpm=68, bars=24, seed=16889, structure='0–4 歸航 / 4–12 深空 / 12–20 家園星光 / 20–24 落地'),
    ]
    manifests=[]
    for track in tracks:
        score=compose(track)
        pcm,metrics=finish(score)
        # Video/master WAV is generated locally, never requested by game.
        masterDir=ROOT/'artifacts/kaios-original-ost/game-masters'
        masterDir.mkdir(parents=True,exist_ok=True)
        master=masterDir/(track['file']+'.master.wav')
        with wave.open(str(master),'wb') as f:
            f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(pcm.tobytes())
        # Pick an 8-bar full harmonic cycle (4 bars for the short level motif).
        # Re-synthesize ALL tails modulo the cycle rather than trimming a
        # mastered ending or repeating MP3 encoder delay. Circular reverb has
        # no missing tail at the seam. Exactly integer sample periods.
        bars=min(8,track['bars']); first=8 if track['bars']>=24 else 0
        seconds=bars*4*60/track['bpm']; n=round(seconds*SR)
        dry=np.zeros((n,2),dtype=np.float32)
        events=[dict(e,beat=e['beat']-first*4) for e in score.events if first*4<=e['beat']<(first+bars)*4]
        for e in events:
            signal=score.synth(e['voice'],e['midi'],e['beats']*score.beat)*e['amplitude']
            at=round(e['beat']*score.beat*SR);pan=(e['pan']+1)*np.pi/4
            for start in range(0,len(signal),n):
                chunk=signal[start:start+n]; idx=(np.arange(len(chunk))+at+start)%n
                dry[idx,0]+=chunk*np.cos(pan);dry[idx,1]+=chunk*np.sin(pan)
        out=dry.copy()
        for delay,amp in [(.109,.10),(.293,.08),(.631,.055),(1.213,.035)]:
            out+=np.roll(dry[:,::-1],round(delay*SR),axis=0)*amp
        out=np.tanh(out*.85)
        # RMS-aligned, conservative peak headroom for SFX + voice ducking.
        out*=min(.72/max(np.max(np.abs(out)),1e-9),.15/max(np.sqrt(np.mean(out*out)),1e-9))
        # Antialias then 22.05 kHz stereo PCM: selected-only ~1.5–2.5 MB.
        # Circular filter preserves the loop, unlike a zero-padded edge filter.
        kernel=np.sinc(np.arange(-24,25)*.45)*np.hanning(49);kernel/=kernel.sum()
        filtered=sum(np.roll(out,i-24,axis=0)*v for i,v in enumerate(kernel))
        loop=filtered[::2].copy()
        # Remove residual edge discontinuity over 4 ms without dropping beats.
        edge=round(.004*SR/2); delta=loop[0]-loop[-1]
        loop[-edge:]+=np.linspace(0,1,edge)[:,None]*delta
        # Browser resamplers zero-pad the decode boundaries. A short raised
        # cosine guard avoids their discontinuity without changing beat length.
        guard=round(.003*SR/2); ramp=.5-.5*np.cos(np.linspace(0,np.pi,guard))
        loop[:guard]*=ramp[:,None];loop[-guard:]*=ramp[::-1,None]
        loopPCM=np.round(loop*32767).astype('<i2')
        path=HERE/(track['file']+'.loop.wav')
        with wave.open(str(path),'wb') as f:
            f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR//2);f.writeframes(loopPCM.tobytes())
        scorePath=HERE/(track['file']+'.score.json')
        scorePath.write_text(json.dumps(dict(track=track,events=score.events),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        qa=dict(peakDbFS=round(float(20*np.log10(np.max(np.abs(loop)))),2),rmsDbFS=round(float(20*np.log10(np.sqrt(np.mean(loop*loop)))),2),clippedSamples=int(np.sum(np.abs(loop)>=1)),seamDelta=int(np.max(np.abs(loopPCM[0].astype(int)-loopPCM[-1].astype(int)))),durationSeconds=len(loop)/(SR//2),humanListening='PENDING_HUMAN_REVIEW')
        assert qa['clippedSamples']==0 and qa['seamDelta']<=1 and qa['peakDbFS']<-2
        manifests.append(dict(TRACK_ID=track['id'],TITLE=track['title'],WORLD=track['world'],COMPOSER='KAIOS / codex-gm-01',CREATION_DATE='2026-10-02',CREATION_METHOD='Original symbolic composition; deterministic additive/FM/noise synthesis. Circular tail/reverb game loop; complete video master.',SOURCE_ASSETS=['render.py',scorePath.name],THIRD_PARTY_RECORDING='NO',THIRD_PARTY_SAMPLE='NO',COMMERCIAL_MELODY_COPIED='NO',GAME_USE='YES',VIDEO_USE='YES',loop=path.name,master=str(master.relative_to(ROOT)).replace('\\','/'),masterSha256=hashlib.sha256(master.read_bytes()).hexdigest(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size,bpm=track['bpm'],qa=qa))
        print(track['id'],json.dumps(qa),flush=True)
    (HERE/'KAIOS_AUDIO_PROVENANCE.json').write_text(json.dumps(dict(tracks=manifests,sourcePolicy='KAIOS_FIRST_PARTY_OST_ONLY',authority='../kaios-audio.mjs',rendererSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()),ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':game_main()
