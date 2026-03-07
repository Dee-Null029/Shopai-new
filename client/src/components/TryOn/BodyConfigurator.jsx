export default function BodyConfigurator({ params, onChange }) {
  const measurements = [
    { key: 'height', label: 'Height', unit: 'cm', min: 140, max: 210, step: 1 },
    { key: 'chest', label: 'Chest', unit: 'cm', min: 70, max: 130, step: 1 },
    { key: 'waist', label: 'Waist', unit: 'cm', min: 55, max: 120, step: 1 },
    { key: 'hip', label: 'Hip', unit: 'cm', min: 70, max: 130, step: 1 },
  ];

  const presets = [
    { name: 'Slim', params: { height: 175, chest: 88, waist: 72, hip: 88 } },
    { name: 'Average', params: { height: 170, chest: 95, waist: 80, hip: 95 } },
    { name: 'Athletic', params: { height: 178, chest: 102, waist: 82, hip: 96 } },
    { name: 'Plus', params: { height: 168, chest: 110, waist: 95, hip: 112 } },
  ];

  return (
    <div className="space-y-6">
      {/* Quick presets */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Body Type Presets</label>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.params)}
              className="text-xs py-2 px-3 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg transition-colors font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement sliders */}
      {measurements.map(({ key, label, unit, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <span className="text-sm font-bold text-brand-600">
              {params[key] || ((min + max) / 2)} {unit}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key] || ((min + max) / 2)}
            onChange={(e) => onChange({ ...params, [key]: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>{min}{unit}</span>
            <span>{max}{unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
