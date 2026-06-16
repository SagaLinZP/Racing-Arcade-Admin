import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type { SessionGameConfig, GamePlatform } from '@/data/competitions'
import {
  YES_NO,
  ACC_TRACKS,
  ACC_CAR_GROUPS,
  FORMATION_LAP_TYPES,
  TRACK_MEDALS,
  TC_ABS_OPTIONS,
  START_RULE_OPTIONS,
} from './gameConfigOptions'

type GCTabKey = 'trackWeather' | 'raceRules' | 'assists'

export function GameConfigEditor({
  gameConfig,
  game,
  onChange,
}: {
  gameConfig: SessionGameConfig
  game: GamePlatform
  onChange: (key: keyof SessionGameConfig, value: string | number | boolean) => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<GCTabKey>('trackWeather')

  const gc = gameConfig

  const tabs: { key: GCTabKey; label: string }[] = [
    { key: 'trackWeather', label: t('gameConfig.tabTrackWeather') },
    { key: 'raceRules', label: t('gameConfig.tabRaceRules') },
    { key: 'assists', label: t('gameConfig.tabAssists') },
  ]

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'trackWeather' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.trackInfo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {game === 'ACC' ? (
                <>
                  <Select label={t('gameConfig.track')} options={ACC_TRACKS} value={gc.track || ''} onChange={(e) => onChange('track', e.target.value)} />
                  <Select label={t('gameConfig.carGroup')} options={ACC_CAR_GROUPS} value={gc.carGroup || 'GT3'} onChange={(e) => onChange('carGroup', e.target.value)} />
                </>
              ) : (
                <>
                  <Input label={t('gameConfig.track')} value={gc.track || ''} onChange={(e) => onChange('track', e.target.value)} />
                  <Input label={t('gameConfig.trackLayout')} value={gc.trackLayout || ''} onChange={(e) => onChange('trackLayout', e.target.value)} />
                  <Input label={t('gameConfig.cars')} value={gc.cars || ''} onChange={(e) => onChange('cars', e.target.value)} placeholder="car1;car2;car3" />
                </>
              )}
            </div>
          </div>

          {game === 'ACC' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.weatherConditions')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input label={t('gameConfig.cloudLevel')} type="number" step="0.1" min="0" max="1" value={String(gc.cloudLevel ?? 0)} onChange={(e) => onChange('cloudLevel', Number(e.target.value))} />
                <Input label={t('gameConfig.rain')} type="number" step="0.1" min="0" max="1" value={String(gc.rain ?? 0)} onChange={(e) => onChange('rain', Number(e.target.value))} />
                <Input label={t('gameConfig.weatherRandomness')} type="number" min="0" max="7" value={String(gc.weatherRandomness ?? 0)} onChange={(e) => onChange('weatherRandomness', Number(e.target.value))} />
                <Input label={t('gameConfig.ambientTemp')} type="number" value={String(gc.ambientTemp ?? 26)} onChange={(e) => onChange('ambientTemp', Number(e.target.value))} />
                <Input label={t('gameConfig.trackTemp')} type="number" value={String(gc.trackTemp ?? 30)} onChange={(e) => onChange('trackTemp', Number(e.target.value))} />
                <Input label={t('gameConfig.timeMultiplier')} type="number" step="0.1" min="0" value={String(gc.timeMultiplier ?? 1)} onChange={(e) => onChange('timeMultiplier', Number(e.target.value))} />
                <Select label={t('gameConfig.fixedConditionQualification')} options={YES_NO} value={String(gc.isFixedConditionQualification ?? false)} onChange={(e) => onChange('isFixedConditionQualification', e.target.value === 'true')} />
              </div>
            </div>
          )}

          {game === 'AC' && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.weatherConditions')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.weatherGraphics')} value={gc.weatherGraphics || ''} onChange={(e) => onChange('weatherGraphics', e.target.value)} />
                  <Input label={t('gameConfig.sunAngle')} type="number" value={String(gc.sunAngle ?? 40)} onChange={(e) => onChange('sunAngle', Number(e.target.value))} />
                  <Input label={t('gameConfig.timeMultiplier')} type="number" step="0.1" min="0" value={String(gc.timeMultiplier ?? 1)} onChange={(e) => onChange('timeMultiplier', Number(e.target.value))} />
                  <Input label={t('gameConfig.baseTempAmbient')} type="number" value={String(gc.baseTempAmbient ?? 26)} onChange={(e) => onChange('baseTempAmbient', Number(e.target.value))} />
                  <Input label={t('gameConfig.variationAmbient')} type="number" value={String(gc.variationAmbient ?? 1)} onChange={(e) => onChange('variationAmbient', Number(e.target.value))} />
                  <Input label={t('gameConfig.baseTempRoad')} type="number" value={String(gc.baseTempRoad ?? 8)} onChange={(e) => onChange('baseTempRoad', Number(e.target.value))} />
                  <Input label={t('gameConfig.variationRoad')} type="number" value={String(gc.variationRoad ?? 1)} onChange={(e) => onChange('variationRoad', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.wind')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input label={t('gameConfig.windSpeedMin')} type="number" value={String(gc.windSpeedMin ?? 2)} onChange={(e) => onChange('windSpeedMin', Number(e.target.value))} />
                  <Input label={t('gameConfig.windSpeedMax')} type="number" value={String(gc.windSpeedMax ?? 10)} onChange={(e) => onChange('windSpeedMax', Number(e.target.value))} />
                  <Input label={t('gameConfig.windDirection')} type="number" value={String(gc.windDirection ?? 0)} onChange={(e) => onChange('windDirection', Number(e.target.value))} />
                  <Input label={t('gameConfig.windVariationDirection')} type="number" value={String(gc.windVariationDirection ?? 0)} onChange={(e) => onChange('windVariationDirection', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.dynamicTrack')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input label={t('gameConfig.trackGripSessionStart')} type="number" min="0" max="100" value={String(gc.trackGripSessionStart ?? 96)} onChange={(e) => onChange('trackGripSessionStart', Number(e.target.value))} />
                  <Input label={t('gameConfig.trackGripRandomness')} type="number" min="0" max="10" value={String(gc.trackGripRandomness ?? 1)} onChange={(e) => onChange('trackGripRandomness', Number(e.target.value))} />
                  <Input label={t('gameConfig.trackGripLapGain')} type="number" value={String(gc.trackGripLapGain ?? 120)} onChange={(e) => onChange('trackGripLapGain', Number(e.target.value))} />
                  <Input label={t('gameConfig.trackGripSessionTransfer')} type="number" min="0" max="100" value={String(gc.trackGripSessionTransfer ?? 50)} onChange={(e) => onChange('trackGripSessionTransfer', Number(e.target.value))} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'raceRules' && (
        <div className="space-y-4">
          {game === 'ACC' && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.pitAndDriverRules')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.mandatoryPitstopCount')} type="number" min="0" value={String(gc.mandatoryPitstopCount ?? 0)} onChange={(e) => onChange('mandatoryPitstopCount', Number(e.target.value))} />
                  <Input label={t('gameConfig.pitWindowLengthSec')} type="number" value={String(gc.pitWindowLengthSec ?? -1)} onChange={(e) => onChange('pitWindowLengthSec', Number(e.target.value))} />
                  <Input label={t('gameConfig.driverStintTimeSec')} type="number" value={String(gc.driverStintTimeSec ?? 0)} onChange={(e) => onChange('driverStintTimeSec', Number(e.target.value))} />
                  <Input label={t('gameConfig.maxDriversCount')} type="number" min="1" value={String(gc.maxDriversCount ?? 1)} onChange={(e) => onChange('maxDriversCount', Number(e.target.value))} />
                  <Input label={t('gameConfig.tyreSetCount')} type="number" min="0" value={String(gc.tyreSetCount ?? 0)} onChange={(e) => onChange('tyreSetCount', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.refuellingAndStops')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select label={t('gameConfig.refuellingAllowed')} options={YES_NO} value={String(gc.isRefuellingAllowedInRace ?? true)} onChange={(e) => onChange('isRefuellingAllowedInRace', e.target.value === 'true')} />
                  <Select label={t('gameConfig.mandatoryPitRefuelling')} options={YES_NO} value={String(gc.isMandatoryPitstopRefuellingRequired ?? false)} onChange={(e) => onChange('isMandatoryPitstopRefuellingRequired', e.target.value === 'true')} />
                  <Select label={t('gameConfig.mandatoryPitTyreChange')} options={YES_NO} value={String(gc.isMandatoryPitstopTyreChangeRequired ?? false)} onChange={(e) => onChange('isMandatoryPitstopTyreChangeRequired', e.target.value === 'true')} />
                  <Select label={t('gameConfig.mandatoryPitSwapDriver')} options={YES_NO} value={String(gc.isMandatoryPitstopSwapDriverRequired ?? false)} onChange={(e) => onChange('isMandatoryPitstopSwapDriverRequired', e.target.value === 'true')} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.timers')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label={t('gameConfig.preRaceWaitingTime')} type="number" value={String(gc.preRaceWaitingTimeSeconds ?? 60)} onChange={(e) => onChange('preRaceWaitingTimeSeconds', Number(e.target.value))} />
                  <Input label={t('gameConfig.sessionOverTime')} type="number" value={String(gc.sessionOverTimeSeconds ?? 120)} onChange={(e) => onChange('sessionOverTimeSeconds', Number(e.target.value))} />
                  <Input label={t('gameConfig.postQualySeconds')} type="number" value={String(gc.postQualySeconds ?? 600)} onChange={(e) => onChange('postQualySeconds', Number(e.target.value))} />
                  <Input label={t('gameConfig.postRaceSeconds')} type="number" value={String(gc.postRaceSeconds ?? 600)} onChange={(e) => onChange('postRaceSeconds', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.formation')}</h4>
                <Select label={t('gameConfig.formationLapType')} options={FORMATION_LAP_TYPES} value={String(gc.formationLapType ?? 1)} onChange={(e) => onChange('formationLapType', Number(e.target.value))} />
              </div>
            </>
          )}

          {game === 'AC' && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.carAndTrackRules')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.damageMultiplier')} type="number" min="0" max="100" value={String(gc.damageMultiplier ?? 100)} onChange={(e) => onChange('damageMultiplier', Number(e.target.value))} />
                  <Input label={t('gameConfig.fuelRate')} type="number" min="0" max="100" value={String(gc.fuelRate ?? 100)} onChange={(e) => onChange('fuelRate', Number(e.target.value))} />
                  <Input label={t('gameConfig.tyreWearRate')} type="number" min="0" max="100" value={String(gc.tyreWearRate ?? 100)} onChange={(e) => onChange('tyreWearRate', Number(e.target.value))} />
                  <Input label={t('gameConfig.legalTyres')} value={gc.legalTyres || ''} onChange={(e) => onChange('legalTyres', e.target.value)} placeholder="S;M;H" />
                  <Select label={t('gameConfig.startRule')} options={START_RULE_OPTIONS} value={String(gc.startRule ?? 0)} onChange={(e) => onChange('startRule', Number(e.target.value))} />
                  <Select label={t('gameConfig.loopMode')} options={YES_NO} value={String(gc.loopMode ?? false)} onChange={(e) => onChange('loopMode', e.target.value === 'true')} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.pitWindow')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.pitWindowStart')} type="number" value={String(gc.racePitWindowStart ?? 0)} onChange={(e) => onChange('racePitWindowStart', Number(e.target.value))} />
                  <Input label={t('gameConfig.pitWindowEnd')} type="number" value={String(gc.racePitWindowEnd ?? 0)} onChange={(e) => onChange('racePitWindowEnd', Number(e.target.value))} />
                  <Input label={t('gameConfig.reversedGridPositions')} type="number" value={String(gc.reversedGridRacePositions ?? 0)} onChange={(e) => onChange('reversedGridRacePositions', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.extra')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select label={t('gameConfig.raceExtraLap')} options={YES_NO} value={String(gc.raceExtraLap ?? false)} onChange={(e) => onChange('raceExtraLap', e.target.value === 'true')} />
                  <Select label={t('gameConfig.tyreBlanketsAllowed')} options={YES_NO} value={String(gc.tyreBlanketsAllowed ?? true)} onChange={(e) => onChange('tyreBlanketsAllowed', e.target.value === 'true')} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'assists' && (
        <div className="space-y-4">
          {game === 'ACC' && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.drivingAssists')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label={t('gameConfig.stabilityControlMax')} type="number" min="0" max="100" value={String(gc.stabilityControlLevelMax ?? 0)} onChange={(e) => onChange('stabilityControlLevelMax', Number(e.target.value))} />
                  <Select label={t('gameConfig.disableIdealLine')} options={YES_NO} value={String(gc.disableIdealLine ?? false)} onChange={(e) => onChange('disableIdealLine', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutosteer')} options={YES_NO} value={String(gc.disableAutosteer ?? false)} onChange={(e) => onChange('disableAutosteer', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoGear')} options={YES_NO} value={String(gc.disableAutoGear ?? false)} onChange={(e) => onChange('disableAutoGear', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoClutch')} options={YES_NO} value={String(gc.disableAutoClutch ?? false)} onChange={(e) => onChange('disableAutoClutch', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoPitLimiter')} options={YES_NO} value={String(gc.disableAutoPitLimiter ?? false)} onChange={(e) => onChange('disableAutoPitLimiter', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoEngineStart')} options={YES_NO} value={String(gc.disableAutoEngineStart ?? false)} onChange={(e) => onChange('disableAutoEngineStart', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoWiper')} options={YES_NO} value={String(gc.disableAutoWiper ?? false)} onChange={(e) => onChange('disableAutoWiper', e.target.value === 'true')} />
                  <Select label={t('gameConfig.disableAutoLights')} options={YES_NO} value={String(gc.disableAutoLights ?? false)} onChange={(e) => onChange('disableAutoLights', e.target.value === 'true')} />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.driverRequirements')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select label={t('gameConfig.trackMedalsRequirement')} options={TRACK_MEDALS} value={String(gc.trackMedalsRequirement ?? -1)} onChange={(e) => onChange('trackMedalsRequirement', Number(e.target.value))} />
                  <Input label={t('gameConfig.safetyRatingRequirement')} type="number" min="-1" value={String(gc.safetyRatingRequirement ?? -1)} onChange={(e) => onChange('safetyRatingRequirement', Number(e.target.value))} />
                  <Input label={t('gameConfig.racecraftRatingRequirement')} type="number" min="-1" value={String(gc.racecraftRatingRequirement ?? -1)} onChange={(e) => onChange('racecraftRatingRequirement', Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {game === 'AC' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('gameConfig.drivingAssists')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select label={t('gameConfig.tcAllowed')} options={TC_ABS_OPTIONS} value={String(gc.tcAllowed ?? 0)} onChange={(e) => onChange('tcAllowed', Number(e.target.value))} />
                <Select label={t('gameConfig.absAllowed')} options={TC_ABS_OPTIONS} value={String(gc.absAllowed ?? 0)} onChange={(e) => onChange('absAllowed', Number(e.target.value))} />
                <Select label={t('gameConfig.stabilityAllowed')} options={YES_NO} value={String(gc.stabilityAllowed ?? false)} onChange={(e) => onChange('stabilityAllowed', e.target.value === 'true')} />
                <Select label={t('gameConfig.autoclutchAllowed')} options={YES_NO} value={String(gc.autoclutchAllowed ?? false)} onChange={(e) => onChange('autoclutchAllowed', e.target.value === 'true')} />
                <Select label={t('gameConfig.forceVirtualMirror')} options={YES_NO} value={String(gc.forceVirtualMirror ?? false)} onChange={(e) => onChange('forceVirtualMirror', e.target.value === 'true')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
