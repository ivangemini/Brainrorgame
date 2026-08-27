import { getAllCreatures, isCreatureFamily, type CreatureKey } from '../content/creatures';
import { getAchievementCopy, type AchievementCopyId } from '../i18n/achievementCopy';
import type { BoardState } from './board';
import type { EncounterStep } from './encounters';
import { mergesRequiredForTier } from './mergeTiers';
import type { MetaUpgradeLevels } from './metaProgression';

export type CollectionKey = CreatureKey;
export const COLLECTION_KEYS: readonly CollectionKey[] = getAllCreatures().map((creature) => creature.key);
export type LifetimeEvent = 'merge' | 'recruit' | 'defeat' | 'boss' | 'upgrade';
export const COLLECTION_ART_TIER_MAX = 3 as const;
export interface LifetimeStats { readonly merges:number; readonly recruits:number; readonly defeats:number; readonly bosses:number; readonly upgrades:number; }
export interface CollectionProgress { readonly discovered:readonly CollectionKey[]; readonly stats:LifetimeStats; readonly claimedAchievements:readonly AchievementId[]; }
export interface AchievementReward { readonly coins:number; readonly coreShards:number; }
export type AchievementMetric = keyof LifetimeStats | 'discoveries';
export interface AchievementDefinition { readonly id:AchievementId; readonly name:string; readonly description:string; readonly metric:AchievementMetric; readonly target:number; readonly reward:AchievementReward; }
export interface AchievementClaimResult { readonly claimed:boolean; readonly reward:AchievementReward; readonly progress:CollectionProgress; }

const COMPLETE_CODEX_TARGET = COLLECTION_KEYS.length;
type AchievementConfig = Omit<AchievementDefinition, 'name' | 'description'>;
const ACHIEVEMENT_CONFIGS: readonly AchievementConfig[] = [
  { id:'first-fusion',metric:'merges',target:1,reward:{coins:50,coreShards:0}},
  { id:'merge-maniac',metric:'merges',target:10,reward:{coins:0,coreShards:1}},
  { id:'fusion-factory',metric:'merges',target:50,reward:{coins:250,coreShards:0}},
  { id:'fusion-overdrive',metric:'merges',target:150,reward:{coins:0,coreShards:3}},
  { id:'weird-recruiter',metric:'recruits',target:10,reward:{coins:100,coreShards:0}},
  { id:'anomaly-scout',metric:'recruits',target:50,reward:{coins:300,coreShards:0}},
  { id:'anomaly-obsessed',metric:'recruits',target:150,reward:{coins:0,coreShards:3}},
  { id:'wave-cleaner',metric:'defeats',target:20,reward:{coins:150,coreShards:0}},
  { id:'chaos-cleaner',metric:'defeats',target:100,reward:{coins:350,coreShards:0}},
  { id:'fortress-janitor',metric:'defeats',target:300,reward:{coins:0,coreShards:4}},
  { id:'boss-breaker',metric:'bosses',target:5,reward:{coins:0,coreShards:2}},
  { id:'boss-nightmare',metric:'bosses',target:20,reward:{coins:0,coreShards:4}},
  { id:'core-engineer',metric:'upgrades',target:3,reward:{coins:0,coreShards:1}},
  { id:'codex-scout',metric:'discoveries',target:7,reward:{coins:200,coreShards:0}},
  { id:'codex-complete',metric:'discoveries',target:COMPLETE_CODEX_TARGET,reward:{coins:0,coreShards:7}}
] as const;
export type AchievementId = AchievementCopyId;
export const ACHIEVEMENTS: readonly AchievementDefinition[] = ACHIEVEMENT_CONFIGS.map((config) => ({
  ...config,
  ...getAchievementCopy(config.id, config.target)
}));

export function createDefaultCollectionProgress(board?:BoardState):CollectionProgress { const progress:CollectionProgress={discovered:[],stats:{merges:0,recruits:0,defeats:0,bosses:0,upgrades:0},claimedAchievements:[]}; return board?discoverFromBoard(progress,board):progress; }
export function backfillCollectionProgress(board:BoardState,chapter:number,encounterStep:EncounterStep,recruitSerial:number,upgrades:MetaUpgradeLevels):CollectionProgress { const minimumMergeCount=board.reduce((total,unit)=>unit?total+mergesRequiredForTier(unit.level):total,0); const completedChapters=Math.max(0,Math.floor(chapter)-1); const completedTargets=completedChapters*4+Math.max(0,Math.min(3,encounterStep)); const progress:CollectionProgress={discovered:[],stats:{merges:minimumMergeCount,recruits:Math.max(0,Math.floor(recruitSerial)),defeats:completedTargets,bosses:completedChapters,upgrades:upgrades.power+upgrades.armor+upgrades.bounty},claimedAchievements:[]}; return discoverFromBoard(progress,board); }
export function discoverFromBoard(progress:CollectionProgress,board:BoardState):CollectionProgress { let next=progress; for(const unit of board){if(!unit)continue; for(let level=1;level<=unit.level;level+=1) next=discoverCreature(next,`${unit.family}-${level}`);} return next; }
export function normalizeCollectionKey(value:string):CollectionKey|null { if(isCollectionKey(value)) return value; const match=/^([a-z]+)-(\d+)$/.exec(value); if(!match)return null; const family=match[1]; const level=Number(match[2]); if(!isCreatureFamily(family)||!Number.isInteger(level)||level<1)return null; const artLevel=Math.min(COLLECTION_ART_TIER_MAX,level); const normalized=`${family}-${artLevel}`; return isCollectionKey(normalized)?normalized:null; }
export function discoverCreature(progress:CollectionProgress,key:string):CollectionProgress { const normalized=normalizeCollectionKey(key); if(!normalized||progress.discovered.includes(normalized)) return progress; return {...progress,discovered:[...progress.discovered,normalized]}; }
export function recordLifetimeEvent(progress:CollectionProgress,event:LifetimeEvent,amount=1):CollectionProgress { const increment=Math.max(0,Math.floor(amount)); if(increment===0)return progress; const stat=statForEvent(event); return {...progress,stats:{...progress.stats,[stat]:Math.min(1_000_000_000,progress.stats[stat]+increment)}}; }
export function achievementProgress(progress:CollectionProgress,id:AchievementId):{current:number;target:number;ready:boolean;claimed:boolean}{ const definition=getAchievement(id); const current=definition.metric==='discoveries'?progress.discovered.length:progress.stats[definition.metric]; const claimed=progress.claimedAchievements.includes(id); return {current:Math.min(current,definition.target),target:definition.target,ready:current>=definition.target&&!claimed,claimed}; }
export function hasAchievementClaimAvailable(progress:CollectionProgress):boolean { return ACHIEVEMENTS.some((achievement)=>achievementProgress(progress,achievement.id).ready); }
export function claimAchievement(progress:CollectionProgress,id:AchievementId):AchievementClaimResult { const definition=getAchievement(id); const status=achievementProgress(progress,id); if(!status.ready)return {claimed:false,reward:{coins:0,coreShards:0},progress}; return {claimed:true,reward:definition.reward,progress:{...progress,claimedAchievements:[...progress.claimedAchievements,id]}}; }
export function getAchievement(id:AchievementId):AchievementDefinition { const definition=ACHIEVEMENTS.find((achievement)=>achievement.id===id); if(!definition)throw new Error(`Unknown achievement: ${id}`); return definition; }
export function isCollectionKey(value:unknown):value is CollectionKey { return typeof value==='string'&&(COLLECTION_KEYS as readonly string[]).includes(value); }
export function isAchievementId(value:unknown):value is AchievementId { return typeof value==='string'&&ACHIEVEMENTS.some((achievement)=>achievement.id===value); }
function statForEvent(event:LifetimeEvent):keyof LifetimeStats { if(event==='merge')return 'merges'; if(event==='recruit')return 'recruits'; if(event==='defeat')return 'defeats'; if(event==='boss')return 'bosses'; return 'upgrades'; }
