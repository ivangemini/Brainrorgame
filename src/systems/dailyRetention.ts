export type DailyMissionId = 'merge' | 'defeat' | 'recruit';

export interface DailyMissionCounters { readonly merge: number; readonly defeat: number; readonly recruit: number; }
export interface DailyMissionClaims { readonly merge: boolean; readonly defeat: boolean; readonly recruit: boolean; }
export interface DailyRetentionState { readonly dayKey: string; readonly streak: number; readonly lastRewardClaimDayKey: string | null; readonly counters: DailyMissionCounters; readonly claimed: DailyMissionClaims; }
export interface DailyReward { readonly day: number; readonly coins: number; readonly coreShards: number; }
export interface DailyClaimResult { readonly claimed: boolean; readonly reward: DailyReward | null; readonly state: DailyRetentionState; }
export interface MissionClaimResult { readonly claimed: boolean; readonly coins: number; readonly chestBonusCoins: number; readonly state: DailyRetentionState; }
export interface DailyMissionDefinition { readonly id: DailyMissionId; readonly name: string; readonly target: number; readonly rewardCoins: number; }

export const DAILY_MISSIONS: readonly DailyMissionDefinition[] = [
  { id: 'merge', name: 'Merge 3 times', target: 3, rewardCoins: 70 },
  { id: 'defeat', name: 'Defeat 6 enemies', target: 6, rewardCoins: 90 },
  { id: 'recruit', name: 'Recruit 3 weirdos', target: 3, rewardCoins: 60 }
] as const;
export const DAILY_CHAOS_CHEST_REWARD_COINS = 300;
const DEFAULT_DAILY_REWARD: DailyReward = { day: 1, coins: 80, coreShards: 0 };
const DAILY_REWARDS: readonly DailyReward[] = [DEFAULT_DAILY_REWARD,{day:2,coins:100,coreShards:0},{day:3,coins:120,coreShards:0},{day:4,coins:160,coreShards:0},{day:5,coins:200,coreShards:0},{day:6,coins:260,coreShards:0},{day:7,coins:320,coreShards:1}] as const;
const DAY_MS = 86_400_000;

export function utcDayKey(now = Date.now()): string { return new Date(now).toISOString().slice(0, 10); }
export function createDefaultDailyState(now = Date.now()): DailyRetentionState { return { dayKey: utcDayKey(now), streak: 0, lastRewardClaimDayKey: null, counters: { merge: 0, defeat: 0, recruit: 0 }, claimed: { merge: false, defeat: false, recruit: false } }; }
export function rollDailyState(state: DailyRetentionState, now = Date.now()): DailyRetentionState { const today=utcDayKey(now); if(state.dayKey===today)return state; return {...state,dayKey:today,counters:{merge:0,defeat:0,recruit:0},claimed:{merge:false,defeat:false,recruit:false}}; }
export function canClaimDailyReward(state: DailyRetentionState, now = Date.now()): boolean { return state.lastRewardClaimDayKey !== utcDayKey(now); }
export function hasDailyClaimAvailable(state: DailyRetentionState, now = Date.now()): boolean { const current=rollDailyState(state,now); if(canClaimDailyReward(current,now))return true; return DAILY_MISSIONS.some(mission=>current.counters[mission.id]>=mission.target&&!current.claimed[mission.id]); }
export function claimDailyReward(state: DailyRetentionState, now = Date.now()): DailyClaimResult { const current=rollDailyState(state,now);const today=utcDayKey(now);if(current.lastRewardClaimDayKey===today)return{claimed:false,reward:null,state:current};const consecutive=current.lastRewardClaimDayKey!==null&&dayDistance(current.lastRewardClaimDayKey,today)===1;const streak=consecutive?(current.streak%7)+1:1;const reward=rewardForStreak(streak);return{claimed:true,reward,state:{...current,streak,lastRewardClaimDayKey:today}}; }
export function recordDailyAction(state: DailyRetentionState, action: DailyMissionId, amount = 1, now = Date.now()): DailyRetentionState { const current=rollDailyState(state,now);const definition=getDailyMission(action);const nextValue=Math.min(definition.target,current.counters[action]+Math.max(0,Math.floor(amount)));return{...current,counters:{...current.counters,[action]:nextValue}}; }
export function claimDailyMission(state: DailyRetentionState, id: DailyMissionId, now = Date.now()): MissionClaimResult { const current=rollDailyState(state,now);const definition=getDailyMission(id);if(current.claimed[id]||current.counters[id]<definition.target)return{claimed:false,coins:0,chestBonusCoins:0,state:current};const nextState:DailyRetentionState={...current,claimed:{...current.claimed,[id]:true}};const chestBonusCoins=getDailyMissionCompletionCount(current,now)===DAILY_MISSIONS.length-1?DAILY_CHAOS_CHEST_REWARD_COINS:0;return{claimed:true,coins:definition.rewardCoins+chestBonusCoins,chestBonusCoins,state:nextState}; }
export function getDailyMissionCompletionCount(state: DailyRetentionState, now = Date.now()): number { const current=rollDailyState(state,now);return DAILY_MISSIONS.reduce((count,mission)=>count+(current.claimed[mission.id]?1:0),0); }
export function isDailyChaosChestComplete(state: DailyRetentionState, now = Date.now()): boolean { return getDailyMissionCompletionCount(state,now)===DAILY_MISSIONS.length; }
export function getDailyRewardPreview(state: DailyRetentionState, now = Date.now()): DailyReward { const current=rollDailyState(state,now);const today=utcDayKey(now);if(current.lastRewardClaimDayKey===today&&current.streak>0)return rewardForStreak(current.streak);const consecutive=current.lastRewardClaimDayKey!==null&&dayDistance(current.lastRewardClaimDayKey,today)===1;const nextStreak=consecutive?(current.streak%7)+1:1;return rewardForStreak(nextStreak); }
export function getDailyMission(id: DailyMissionId): DailyMissionDefinition { const definition=DAILY_MISSIONS.find(mission=>mission.id===id);if(!definition)throw new Error(`Unknown daily mission: ${id}`);return definition; }
function rewardForStreak(streak:number):DailyReward{const index=Math.max(0,Math.min(6,Math.floor(streak)-1));return DAILY_REWARDS[index]??DEFAULT_DAILY_REWARD;}
function dayDistance(fromKey:string,toKey:string):number{const from=Date.parse(`${fromKey}T00:00:00.000Z`);const to=Date.parse(`${toKey}T00:00:00.000Z`);if(!Number.isFinite(from)||!Number.isFinite(to))return Number.POSITIVE_INFINITY;return Math.round((to-from)/DAY_MS);}
