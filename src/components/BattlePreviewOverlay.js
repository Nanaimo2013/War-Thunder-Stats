import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ItemTypeIcon from './ItemTypeIcon';
import CountryFlag from './CountryFlag';
import VehicleIcon from './VehicleIcon';
import { Award, Swords, Plane, Car, ShieldAlert, Zap, Clock, X, Eye, EyeOff, Target, Plus, Trash2, Save, ArrowLeft, BarChart3, ChevronDown, BookOpen, ClipboardList, HelpCircle, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { isEqual } from '../utils/helpers';

// Beautiful reusable overlay to preview a single battle in detail
// Props:
// - isOpen: boolean
// - onClose: () => void
// - battle: parsed battle object from battleParser
// - onEdit?: () => void
// - onDelete?: () => void
// - onRemoveFromPreview?: () => void (Data Entry preview removal)
// - context?: 'logs' | 'preview'
const BattlePreviewOverlay = ({ isOpen, onClose, battle, mode = 'view', onSave, onDelete, onRemoveFromPreview, context = 'logs' }) => {
  const [tab, setTab] = useState('main'); // 'main' | 'medals' | 'analytics' | 'raw'
  const [currentMode, setCurrentMode] = useState(mode); // 'view' | 'edit'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [form, setForm] = useState({});
  const [initialForm, setInitialForm] = useState(null);
  const [medals, setMedals] = useState([]);
  const [initialMedals, setInitialMedals] = useState([]);
  const [researchedUnits, setResearchedUnits] = useState([]);
  const [initialResearchedUnits, setInitialResearchedUnits] = useState([]);
  const [researchingProgress, setResearchingProgress] = useState([]);
  const [initialResearchingProgress, setInitialResearchingProgress] = useState([]);

  const hasChanges = useMemo(() => {
    if (currentMode !== 'edit') return false;
    if (!initialForm || !initialMedals) return false;
    return (
      !isEqual(form, initialForm) ||
      !isEqual(medals, initialMedals) ||
      !isEqual(researchedUnits, initialResearchedUnits) ||
      !isEqual(researchingProgress, initialResearchingProgress)
    );
  }, [currentMode, form, initialForm, medals, initialMedals, researchedUnits, initialResearchedUnits, researchingProgress, initialResearchingProgress]);

  const requestClose = () => {
    if (currentMode === 'edit' && hasChanges) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const requestBack = () => {
    if (currentMode === 'edit' && hasChanges) {
      setShowCancelConfirm(true);
    } else {
      setCurrentMode('view');
    }
  };

  const headline = useMemo(() => {
    if (!battle) return '';
    const kills = (battle.killsGround || 0) + (battle.killsAircraft || 0);
    const res = battle.result || 'Unknown';
    const name = battle.missionName || 'Unknown Mission';
    return `${res} · ${name} · ${kills} Kills`;
  }, [battle]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    if (battle) {
      setForm({
        result: battle.result || 'Unknown',
        missionType: battle.missionType || '',
        missionName: battle.missionName || '',
        killsAircraft: battle.killsAircraft || 0,
        killsGround: battle.killsGround || 0,
        assists: battle.assists || 0,
        damage: battle.damage || 0,
        severeDamage: battle.severeDamage || 0,
        criticalDamage: battle.criticalDamage || 0,
        earnedSL: battle.earnedSL || 0,
        totalRP: battle.totalRP || 0,
        earnedCRP: battle.earnedCRP || 0,
        awardsSL: battle.awardsSL || 0,
        rewardSL: battle.rewardSL || 0,
        skillBonusRP: battle.skillBonusRP || 0,
        autoRepairCost: battle.autoRepairCost || 0,
        autoAmmoCrewCost: battle.autoAmmoCrewCost || 0,
        totalSL: battle.totalSL || 0,
        totalCRP: battle.totalCRP || 0,
        activityTimeSL: battle.activityTimeSL || 0,
        activityTimeRP: battle.activityTimeRP || 0,
        timePlayedRP: battle.timePlayedRP || 0,
        activity: battle.activity || 0,
        session: battle.session || '',
        timestamp: battle.timestamp || ''
      });
      setInitialForm({
        result: battle.result || 'Unknown',
        missionType: battle.missionType || '',
        missionName: battle.missionName || '',
        killsAircraft: battle.killsAircraft || 0,
        killsGround: battle.killsGround || 0,
        assists: battle.assists || 0,
        damage: battle.damage || 0,
        severeDamage: battle.severeDamage || 0,
        criticalDamage: battle.criticalDamage || 0,
        earnedSL: battle.earnedSL || 0,
        totalRP: battle.totalRP || 0,
        earnedCRP: battle.earnedCRP || 0,
        awardsSL: battle.awardsSL || 0,
        rewardSL: battle.rewardSL || 0,
        skillBonusRP: battle.skillBonusRP || 0,
        autoRepairCost: battle.autoRepairCost || 0,
        autoAmmoCrewCost: battle.autoAmmoCrewCost || 0,
        totalSL: battle.totalSL || 0,
        totalCRP: battle.totalCRP || 0,
        activityTimeSL: battle.activityTimeSL || 0,
        activityTimeRP: battle.activityTimeRP || 0,
        timePlayedRP: battle.timePlayedRP || 0,
        activity: battle.activity || 0,
        session: battle.session || '',
        timestamp: battle.timestamp || ''
      });
      const m = (battle.detailedAwards || []).map(a => ({ award: a.award || 'Medal', sl: a.sl || 0, rp: a.rp || 0 }));
      setMedals(m);
      setInitialMedals(m);
      const ru = Array.isArray(battle.researchedUnits) ? battle.researchedUnits.map(x => ({ unit: x.unit || '', rp: x.rp || 0 })) : [];
      setResearchedUnits(ru);
      setInitialResearchedUnits(ru);
      const rp = Array.isArray(battle.researchingProgress) ? battle.researchingProgress.map(x => ({ unit: x.unit || '', item: x.item || '', rp: x.rp || 0 })) : [];
      setResearchingProgress(rp);
      setInitialResearchingProgress(rp);
    }
  }, [battle, currentMode]);

  if (!isOpen || !battle) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-700 shadow-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-800 bg-gray-900/60 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${battle.result === 'Victory' ? 'bg-green-700 text-green-100' : battle.result === 'Defeat' ? 'bg-red-700 text-red-100' : 'bg-gray-700 text-gray-200'}`}>{battle.result || 'Unknown'}</span>
                <span className="text-sm text-gray-400">{battle.missionType}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-yellow-300 drop-shadow-sm">{headline}</h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /><span>{new Date(battle.timestamp).toLocaleString()}</span></div>
                <div className="flex items-center gap-2"><Target size={16} className="text-gray-400" /><span>Activity {battle.activity || 0}%</span></div>
                {battle.session && <div className="flex items-center gap-2"><span className="text-gray-400">Session</span><span className="font-mono text-gray-200">{battle.session}</span></div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-1 flex flex-wrap gap-1">
                <button onClick={() => setTab('main')} className={`px-3 py-1 rounded-md text-sm ${tab==='main'?'bg-yellow-600 text-gray-900':'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Main</button>
                <button onClick={() => setTab('medals')} className={`px-3 py-1 rounded-md text-sm ${tab==='medals'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><Award size={14} className="inline mr-1"/>Awards</button>
                {currentMode === 'edit' && (
                  <>
                    <button onClick={() => setTab('research')} className={`px-3 py-1 rounded-md text-sm ${tab==='research'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><ClipboardList size={14} className="inline mr-1"/>Research</button>
                    <button onClick={() => setTab('combat')} className={`px-3 py-1 rounded-md text-sm ${tab==='combat'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><Swords size={14} className="inline mr-1"/>Combat</button>
                    <button onClick={() => setTab('economy')} className={`px-3 py-1 rounded-md text-sm ${tab==='economy'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><ItemTypeIcon type="warpoints" size="xs" /> <span className="ml-1">Economy</span></button>
                    <button onClick={() => setTab('meta')} className={`px-3 py-1 rounded-md text-sm ${tab==='meta'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><BookOpen size={14} className="inline mr-1"/>Meta</button>
                  </>
                )}
                {currentMode !== 'edit' && (
                  <button onClick={() => setTab('analytics')} className={`px-3 py-1 rounded-md text-sm ${tab==='analytics'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}><BarChart3 size={14} className="inline mr-1"/>Analytics</button>
                )}
                <button onClick={() => setTab('raw')} className={`px-3 py-1 rounded-md text-sm ${tab==='raw'?'bg-gray-600 text-white':'text-gray-300 hover:text-white hover:bg-gray-700'}`}>Raw</button>
              </div>
              {currentMode === 'edit' && (
                <button onClick={requestBack} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 transition" aria-label="Back"><ArrowLeft size={18} /></button>
              )}
              <button onClick={requestClose} className="p-2 rounded-lg bg-red-700 hover:bg-red-800 text-white transition" aria-label="Close"><X size={18} /></button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)] custom-scrollbar space-y-6">
          {currentMode === 'edit' && tab==='main' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              {/* Quick editable tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[{label:'Earned SL', key:'earnedSL', color:'from-yellow-700 to-yellow-800', icon:<ItemTypeIcon type="warpoints" size="sm" />},
                  {label:'Total RP', key:'totalRP', color:'from-purple-700 to-purple-800', icon:<ItemTypeIcon type="rp" size="sm" />},
                  {label:'Earned CRP', key:'earnedCRP', color:'from-indigo-700 to-indigo-800', icon:<ItemTypeIcon type="crp" size="sm" />},
                  {label:'Awards SL', key:'awardsSL', color:'from-green-700 to-green-800', icon:<Award size={18} className="text-green-200" />}].map((t)=> (
                  <div key={t.key} className={`bg-gradient-to-br ${t.color} p-4 rounded-xl border border-gray-600`}> 
                    <div className="flex items-center gap-2 mb-1 text-sm text-gray-100">{t.icon}<span>{t.label}</span></div>
                    <input type="number" className="w-full p-2 rounded bg-gray-900/70 border border-gray-700 text-white font-bold" value={form[t.key]} onChange={e=>setForm({...form,[t.key]:Number(e.target.value)})} />
                  </div>
                ))}
              </div>
              {/* Combat + meta grid cards with tooltips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1">Mission Name <HelpCircle size={14} className="text-gray-500" title="Display name shown in logs"/></label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.missionName} onChange={e=>setForm({...form, missionName:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1">Mission Type <HelpCircle size={14} className="text-gray-500" title="Domination/Operation/etc"/></label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.missionType} onChange={e=>setForm({...form, missionType:e.target.value})} />
                </div>
                 <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1">Result <HelpCircle size={14} className="text-gray-500" title="Victory/Defeat/Unknown"/></label>
                  <div className="relative">
                  <select className="w-full appearance-none p-2 pr-9 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.result} onChange={e=>setForm({...form, result:e.target.value})}>
                    <option>Victory</option>
                    <option>Defeat</option>
                    <option>Unknown</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1">Timestamp <HelpCircle size={14} className="text-gray-500" title="Local date/time of battle"/></label>
                  <input type="datetime-local" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.timestamp ? new Date(form.timestamp).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form, timestamp:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Plane size={14} className="text-blue-300"/> Aircraft Kills</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.killsAircraft} onChange={e=>setForm({...form, killsAircraft:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Swords size={14} className="text-red-300"/> Ground Kills</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.killsGround} onChange={e=>setForm({...form, killsGround:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Zap size={14} className="text-yellow-300"/> Assists</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.assists} onChange={e=>setForm({...form, assists:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Damage</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.damage} onChange={e=>setForm({...form, damage:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ShieldAlert size={14} className="text-orange-300"/> Severe Damage</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.severeDamage} onChange={e=>setForm({...form, severeDamage:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ShieldAlert size={14} className="text-rose-300"/> Critical Damage</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.criticalDamage} onChange={e=>setForm({...form, criticalDamage:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="warpoints" size="xs"/> SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.earnedSL} onChange={e=>setForm({...form, earnedSL:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="rp" size="xs"/> RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.totalRP} onChange={e=>setForm({...form, totalRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="crp" size="xs"/> CRP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.earnedCRP} onChange={e=>setForm({...form, earnedCRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Awards SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.awardsSL} onChange={e=>setForm({...form, awardsSL:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Reward SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.rewardSL} onChange={e=>setForm({...form, rewardSL:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Skill Bonus RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.skillBonusRP} onChange={e=>setForm({...form, skillBonusRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Auto Repair Cost (SL)</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.autoRepairCost} onChange={e=>setForm({...form, autoRepairCost:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Ammo/Crew Cost (SL)</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.autoAmmoCrewCost} onChange={e=>setForm({...form, autoAmmoCrewCost:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Total SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.totalSL} onChange={e=>setForm({...form, totalSL:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Total CRP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.totalCRP} onChange={e=>setForm({...form, totalCRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Total RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.totalRP} onChange={e=>setForm({...form, totalRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Activity Time SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.activityTimeSL} onChange={e=>setForm({...form, activityTimeSL:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Activity Time RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.activityTimeRP} onChange={e=>setForm({...form, activityTimeRP:Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Time Played RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.timePlayedRP} onChange={e=>setForm({...form, timePlayedRP:Number(e.target.value)})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm mb-1">Session</label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.session} onChange={e=>setForm({...form, session:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Activity %</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.activity} onChange={e=>setForm({...form, activity:Number(e.target.value)})} />
                </div>
              </div>
              {/* Research sections as category cards */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2"><div className="text-yellow-300 font-semibold flex items-center gap-2"><BookOpen size={16}/> Researched Units</div>{currentMode==='edit' && <button onClick={()=>setResearchedUnits([...researchedUnits,{unit:'',rp:0}])} className="text-sm px-2 py-1 bg-blue-700 text-white rounded">Add</button>}</div>
                  <div className="space-y-2">
                    {researchedUnits.map((u, i)=> (
                      <div key={i} className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-700">
                        <GripVertical size={16} className="text-gray-500"/>
                        <input className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" placeholder="Unit" value={u.unit} onChange={e=>{const c=[...researchedUnits]; c[i]={...c[i], unit:e.target.value}; setResearchedUnits(c);}} />
                        <div className="flex items-center gap-1 w-32">
                          <ItemTypeIcon type="rp" size="xs" />
                          <input type="number" className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={u.rp} onChange={e=>{const c=[...researchedUnits]; c[i]={...c[i], rp:Number(e.target.value)}; setResearchedUnits(c);}} />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>{ if(i>0){ const c=[...researchedUnits]; [c[i-1],c[i]]=[c[i],c[i-1]]; setResearchedUnits(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move up"><ArrowUp size={16}/></button>
                          <button onClick={()=>{ if(i<researchedUnits.length-1){ const c=[...researchedUnits]; [c[i+1],c[i]]=[c[i],c[i+1]]; setResearchedUnits(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move down"><ArrowDown size={16}/></button>
                        </div>
                        <button onClick={()=>{const c=[...researchedUnits]; c.splice(i,1); setResearchedUnits(c);}} className="p-2 rounded bg-red-700 text-white"><Trash2 size={16}/></button>
                      </div>
                    ))}
                    {researchedUnits.length===0 && <div className="text-gray-500 text-sm">No researched units.</div>}
                  </div>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2"><div className="text-yellow-300 font-semibold flex items-center gap-2"><ClipboardList size={16}/> Researching Progress</div>{currentMode==='edit' && <button onClick={()=>setResearchingProgress([...researchingProgress,{unit:'',item:'',rp:0}])} className="text-sm px-2 py-1 bg-blue-700 text-white rounded">Add</button>}</div>
                  <div className="space-y-2">
                    {researchingProgress.map((u, i)=> (
                      <div key={i} className="grid grid-cols-12 gap-2 bg-gray-800 p-2 rounded border border-gray-700">
                        <div className="col-span-1 flex items-center"><GripVertical size={16} className="text-gray-500"/></div>
                        <input className="col-span-5 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" placeholder="Unit" value={u.unit} onChange={e=>{const c=[...researchingProgress]; c[i]={...c[i], unit:e.target.value}; setResearchingProgress(c);}} />
                        <input className="col-span-5 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" placeholder="Item" value={u.item} onChange={e=>{const c=[...researchingProgress]; c[i]={...c[i], item:e.target.value}; setResearchingProgress(c);}} />
                        <div className="col-span-1 flex items-center gap-1">
                          <ItemTypeIcon type="rp" size="xs" />
                          <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={u.rp} onChange={e=>{const c=[...researchingProgress]; c[i]={...c[i], rp:Number(e.target.value)}; setResearchingProgress(c);}} />
                        </div>
                        <div className="col-span-1 flex items-center gap-1 justify-end">
                          <button onClick={()=>{ if(i>0){ const c=[...researchingProgress]; [c[i-1],c[i]]=[c[i],c[i-1]]; setResearchingProgress(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move up"><ArrowUp size={16}/></button>
                          <button onClick={()=>{ if(i<researchingProgress.length-1){ const c=[...researchingProgress]; [c[i+1],c[i]]=[c[i],c[i+1]]; setResearchingProgress(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move down"><ArrowDown size={16}/></button>
                          <button onClick={()=>{const c=[...researchingProgress]; c.splice(i,1); setResearchingProgress(c);}} className="p-2 rounded bg-red-700 text-white"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                    {researchingProgress.length===0 && <div className="text-gray-500 text-sm">No progress entries.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated edit tabs for better organization */}
          {currentMode==='edit' && tab==='combat' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Swords size={14} className="text-red-300"/> Ground Kills</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.killsGround} onChange={e=>setForm({...form, killsGround:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Plane size={14} className="text-blue-300"/> Aircraft Kills</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.killsAircraft} onChange={e=>setForm({...form, killsAircraft:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><Zap size={14} className="text-yellow-300"/> Assists</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.assists} onChange={e=>setForm({...form, assists:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ShieldAlert size={14} className="text-rose-300"/> Critical</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.criticalDamage} onChange={e=>setForm({...form, criticalDamage:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ShieldAlert size={14} className="text-orange-300"/> Severe</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.severeDamage} onChange={e=>setForm({...form, severeDamage:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Damage</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.damage} onChange={e=>setForm({...form, damage:Number(e.target.value)})} />
                </div>
              </div>
            </div>
          )}

          {currentMode==='edit' && tab==='economy' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="warpoints" size="xs"/> Earned SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.earnedSL} onChange={e=>setForm({...form, earnedSL:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="rp" size="xs"/> Total RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.totalRP} onChange={e=>setForm({...form, totalRP:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1 flex items-center gap-1"><ItemTypeIcon type="crp" size="xs"/> Earned CRP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.earnedCRP} onChange={e=>setForm({...form, earnedCRP:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Awards SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.awardsSL} onChange={e=>setForm({...form, awardsSL:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Reward SL</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.rewardSL} onChange={e=>setForm({...form, rewardSL:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Skill Bonus RP</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.skillBonusRP} onChange={e=>setForm({...form, skillBonusRP:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Auto Repair Cost</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.autoRepairCost} onChange={e=>setForm({...form, autoRepairCost:Number(e.target.value)})} />
                </div>
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <label className="block text-gray-300 text-sm mb-1">Ammo/Crew Cost</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={form.autoAmmoCrewCost} onChange={e=>setForm({...form, autoAmmoCrewCost:Number(e.target.value)})} />
                </div>
              </div>
            </div>
          )}

          {currentMode==='edit' && tab==='meta' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Mission Name</label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.missionName} onChange={e=>setForm({...form, missionName:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Mission Type</label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.missionType} onChange={e=>setForm({...form, missionType:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Result</label>
                  <div className="relative">
                    <select className="w-full appearance-none p-2 pr-9 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.result} onChange={e=>setForm({...form, result:e.target.value})}>
                      <option>Victory</option>
                      <option>Defeat</option>
                      <option>Unknown</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Timestamp</label>
                  <input type="datetime-local" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.timestamp ? new Date(form.timestamp).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form, timestamp:e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-300 text-sm mb-1">Session</label>
                  <input className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.session} onChange={e=>setForm({...form, session:e.target.value})} />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Activity %</label>
                  <input type="number" className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-gray-100" value={form.activity} onChange={e=>setForm({...form, activity:Number(e.target.value)})} />
                </div>
              </div>
            </div>
          )}
          {tab === 'main' && (
          <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-700 to-yellow-800 p-4 rounded-xl border border-yellow-600">
              <div className="flex items-center gap-2 mb-1"><ItemTypeIcon type="warpoints" size="sm" /><span className="text-yellow-100 text-sm">Earned SL</span></div>
              <div className="text-white text-xl font-bold">{(battle.earnedSL || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-700 to-purple-800 p-4 rounded-xl border border-purple-600">
              <div className="flex items-center gap-2 mb-1"><ItemTypeIcon type="rp" size="sm" /><span className="text-purple-100 text-sm">Total RP</span></div>
              <div className="text-white text-xl font-bold">{(battle.totalRP || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-800 p-4 rounded-xl border border-indigo-600">
              <div className="flex items-center gap-2 mb-1"><ItemTypeIcon type="crp" size="sm" /><span className="text-indigo-100 text-sm">Earned CRP</span></div>
              <div className="text-white text-xl font-bold">{(battle.earnedCRP || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-green-700 to-green-800 p-4 rounded-xl border border-green-600">
              <div className="flex items-center gap-2 mb-1"><Award size={18} className="text-green-200" /><span className="text-green-100 text-sm">Awards SL</span></div>
              <div className="text-white text-xl font-bold">{(battle.awardsSL || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Combat summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700"><div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Swords size={18} className="text-red-300" />Ground Kills</div><div className="text-2xl font-bold text-red-300">{battle.killsGround || 0}</div></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700"><div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Plane size={18} className="text-blue-300" />Aircraft Kills</div><div className="text-2xl font-bold text-blue-300">{battle.killsAircraft || 0}</div></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700"><div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Zap size={18} className="text-yellow-300" />Assists</div><div className="text-2xl font-bold text-yellow-300">{battle.assists || 0}</div></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700"><div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><ShieldAlert size={18} className="text-rose-300" />Critical</div><div className="text-2xl font-bold text-rose-300">{battle.criticalDamage || 0}</div></div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700"><div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><ShieldAlert size={18} className="text-orange-300" />Severe</div><div className="text-2xl font-bold text-orange-300">{battle.severeDamage || 0}</div></div>
          </div>

          {/* Vehicles used/seen (view mode only) */}
          {currentMode !== 'edit' && battle.vehicles && battle.vehicles.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="text-yellow-300 font-semibold mb-2 flex items-center gap-2"><Car size={18} /> Vehicles</div>
              <div className="flex flex-wrap gap-2">
                {battle.vehicles.map(v => (
                  <div key={v.name} className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded border border-gray-700">
                    <CountryFlag country={v.country} size="xs" />
                    <VehicleIcon vehicleName={v.name} size="xs" />
                    <span className="text-xs truncate max-w-[140px]" title={v.name}>{v.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details sections (view mode only) */}
          {currentMode !== 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Awards list */}
            {battle.detailedAwards && battle.detailedAwards.length > 0 && (
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                <div className="text-yellow-300 font-semibold mb-2 flex items-center gap-2"><Award size={18} /> Awards {battle.detailedAwards.length > 6 && (<button onClick={()=>setTab('medals')} className="ml-auto text-xs text-blue-300 hover:text-blue-200 underline">See more →</button>)}</div>
                <div className="space-y-2 text-sm">
                  {(battle.detailedAwards.slice(0,6)).map((a, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 border border-gray-700">
                      <div className="truncate mr-3">{a.award}</div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-yellow-200"><ItemTypeIcon type="warpoints" size="xs" /> {a.sl?.toLocaleString?.() || a.sl || 0}</div>
                        {!!a.rp && <div className="flex items-center gap-1 text-purple-200"><ItemTypeIcon type="rp" size="xs" /> {a.rp.toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed events (kills/damage/assists) */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="text-yellow-300 font-semibold mb-2 flex items-center gap-2"><Swords size={18} /> Events</div>
              <div className="space-y-2 text-sm max-h-64 overflow-y-auto custom-scrollbar">
                {['detailedKills','detailedAssists','detailedCriticalDamage','detailedSevereDamage','detailedDamage'].map(key => (
                  (battle[key] || []).map((ev, idx) => (
                    <div key={`${key}-${idx}`} className="grid grid-cols-5 gap-2 items-center bg-gray-800 rounded px-3 py-2 border border-gray-700">
                      <div className="col-span-1 text-gray-400 font-mono text-xs">{ev.time || '-'}</div>
                      <div className="col-span-2 truncate" title={`${ev.vehicle || ''}`}>{ev.vehicle || '-'}</div>
                      <div className="col-span-1 truncate" title={`${ev.target || ''}`}>{ev.target || '-'}</div>
                      <div className="col-span-1 text-right text-gray-300">{ev.missionPoints || ''}</div>
                    </div>
                  ))
                ))}
                {(!battle.detailedKills || battle.detailedKills.length === 0) &&
                 (!battle.detailedAssists || battle.detailedAssists.length === 0) &&
                 (!battle.detailedDamage || battle.detailedDamage.length === 0) && (
                   <div className="text-gray-500">No detailed events captured for this entry.</div>
                )}
              </div>
            </div>
          </div>
          )}

          </>
          )}

          {/* Awards/Medals tab with reorder and tooltips */}
          {tab==='medals' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-yellow-300 font-semibold flex items-center gap-2"><Award size={18}/> Awards</h4>
                {currentMode==='edit' && (
                  <button onClick={() => setMedals([...medals, { award: 'New Medal', sl: 0, rp: 0 }])} className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1"><Plus size={16}/>Add</button>
                )}
              </div>
              <div className="space-y-2">
                {medals.length === 0 && <p className="text-gray-400 text-sm">No medals recorded.</p>}
                {medals.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800 p-2 rounded border border-gray-700">
                    <GripVertical size={16} className="text-gray-500" title="Drag handle (use arrows to reorder)"/>
                    {currentMode==='edit' ? (
                      <>
                        <input className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={m.award} onChange={e=>{ const c=[...medals]; c[i]={...c[i], award:e.target.value}; setMedals(c); }} title="Award title"/>
                        <div className="flex items-center gap-1 w-28" title="Silver Lions">
                          <ItemTypeIcon type="warpoints" size="xs" />
                          <input type="number" className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={m.sl} onChange={e=>{ const c=[...medals]; c[i]={...c[i], sl:Number(e.target.value)}; setMedals(c); }} />
                        </div>
                        <div className="flex items-center gap-1 w-28" title="Research Points">
                          <ItemTypeIcon type="rp" size="xs" />
                          <input type="number" className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-gray-100" value={m.rp} onChange={e=>{ const c=[...medals]; c[i]={...c[i], rp:Number(e.target.value)}; setMedals(c); }} />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>{ if(i>0){ const c=[...medals]; [c[i-1],c[i]]=[c[i],c[i-1]]; setMedals(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move up"><ArrowUp size={16}/></button>
                          <button onClick={()=>{ if(i<medals.length-1){ const c=[...medals]; [c[i+1],c[i]]=[c[i],c[i+1]]; setMedals(c);} }} className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white" title="Move down"><ArrowDown size={16}/></button>
                        </div>
                        <button onClick={()=>{ const c=[...medals]; c.splice(i,1); setMedals(c); }} className="p-2 rounded bg-red-700 hover:bg-red-800 text-white"><Trash2 size={16}/></button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{m.award}</span>
                        <span className="text-yellow-300">SL: {m.sl?.toLocaleString?.()||m.sl||0}</span>
                        <span className="text-purple-300">RP: {m.rp?.toLocaleString?.()||m.rp||0}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics tab with micro bars */}
          {tab==='analytics' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <h4 className="text-yellow-300 font-semibold mb-3 flex items-center gap-2"><BarChart3 size={18}/> Quick Analytics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'SL', value: battle.earnedSL||0, color: 'bg-yellow-500' },
                  { label: 'RP', value: battle.totalRP||0, color: 'bg-purple-500' },
                  { label: 'CRP', value: battle.earnedCRP||0, color: 'bg-indigo-500' },
                ].map((m, i, arr) => {
                  const max = Math.max(...arr.map(a=>a.value||0), 1);
                  const pct = Math.min(100, Math.round((m.value||0)/max*100));
                  return (
                    <div key={i} className="bg-gray-800 p-3 rounded border border-gray-700">
                      <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
                        <span>{m.label}</span>
                        <span className="font-mono">{(m.value||0).toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded"><div className={`${m.color} h-2 rounded`} style={{width: pct+'%'}}></div></div>
                    </div>
                  );
                })}
              </div>
              {/* Simple sparkline over time placeholder */}
              {Array.isArray(battle?.detailedTimePlayed) && battle.detailedTimePlayed.length > 0 && (
                <div className="mt-6 bg-gray-800 p-3 rounded border border-gray-700">
                  <div className="text-gray-300 text-sm mb-2">Activity by vehicle (sparkline)</div>
                  <div className="flex gap-3 overflow-x-auto custom-scrollbar">
                    {battle.detailedTimePlayed.slice(0,8).map((t, i) => (
                      <div key={i} className="min-w-[160px]">
                        <div className="text-xs text-gray-400 truncate mb-1" title={t.vehicle}>{t.vehicle}</div>
                        <svg viewBox="0 0 100 24" className="w-full h-6">
                          <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={`0,20 25,${20-Math.min(18, (t.percentage||0)/6)} 50,${20-Math.min(18, (t.percentage||0)/5)} 75,${20-Math.min(18, (t.percentage||0)/4)} 100,${20-Math.min(18, (t.percentage||0)/3)}`} />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'raw' && (
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="text-yellow-300 font-semibold mb-2">Raw Battle Data (JSON)</div>
              <pre className="bg-gray-950 text-gray-200 p-4 rounded-md overflow-auto text-xs custom-scrollbar border border-gray-800"><code>{JSON.stringify(battle, null, 2)}</code></pre>
            </div>
          )}

          {/* Persistent footer actions (sticky) */}
          <div className="sticky bottom-0 left-0 right-0 bg-gray-900/60 border-t border-gray-800 backdrop-blur px-6 py-3 flex flex-wrap gap-3 justify-end">
            {currentMode === 'view' ? (
              <>
                <button onClick={() => { setTab('main'); setCurrentMode('edit'); }} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white border border-blue-600 transition flex items-center gap-2">Edit</button>
                {onDelete && (
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white border border-red-600 transition flex items-center gap-2"><Trash2 size={16}/>Delete</button>
                )}
                {onRemoveFromPreview && (
                  <button onClick={onRemoveFromPreview} className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition">Remove</button>
                )}
              </>
            ) : (
              <>
                {onSave && (
                  <button onClick={() => onSave({ ...battle, ...form, detailedAwards: medals })} className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white border border-green-600 transition flex items-center gap-2"><Save size={16}/>Save</button>
                )}
                <button onClick={() => { if (hasChanges) setShowCancelConfirm(true); else setCurrentMode('view'); }} className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition">Cancel</button>
              </>
            )}
          </div>

          {/* Delete Confirm */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl">
                <p className="text-yellow-300 mb-4">Are you sure you want to delete this battle?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded bg-gray-700 text-gray-200">Cancel</button>
                  <button onClick={() => { setShowDeleteConfirm(false); onDelete && onDelete(battle); }} className="px-4 py-2 rounded bg-red-700 text-white">Delete</button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Confirm */}
          {showCancelConfirm && hasChanges && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl">
                <p className="text-yellow-300 mb-4">Discard changes and close?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 rounded bg-gray-700 text-gray-200">No</button>
                  <button onClick={() => { setShowCancelConfirm(false); if (currentMode==='edit') setCurrentMode('view'); else onClose(); }} className="px-4 py-2 rounded bg-red-700 text-white">Yes</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx="true">{`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #a78b4f; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d97706; }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default BattlePreviewOverlay;


