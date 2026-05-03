import { Check, X, Car, Hotel, Wrench, Music, MonitorSpeaker, Users, Bed, Airplay } from 'lucide-react';

interface Props {
  assetType: string;
  properties: any;
}

export function AssetPropertiesPanel({ assetType, properties }: Props) {
  if (!properties) return null;

  const renderProperty = (label: string, value: any, icon?: React.ReactNode) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
          {icon} {label}
        </span>
        <span className="font-bold text-gray-900 dark:text-white">
          {typeof value === 'boolean' ? (value ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />) : value}
        </span>
      </div>
    );
  };

  const renderContent = () => {
    switch (assetType) {
      case 'VEHICLE':
        return (
          <>
            {renderProperty('Make', properties.make, <Car className="h-4 w-4" />)}
            {renderProperty('Model', properties.model)}
            {renderProperty('Year', properties.year)}
            {renderProperty('License Plate', properties.license_plate)}
            {renderProperty('AC', properties.ac, <Airplay className="h-4 w-4" />)}
            {renderProperty('Seat Capacity', properties.seat_capacity, <Users className="h-4 w-4" />)}
          </>
        );
      case 'ROOM':
      case 'HOTEL_ROOM':
        return (
          <>
            {renderProperty('Room Type', properties.room_type, <Hotel className="h-4 w-4" />)}
            {renderProperty('Floor', properties.floor)}
            {renderProperty('Bed Type', properties.bed_type, <Bed className="h-4 w-4" />)}
            {renderProperty('Max Guests', properties.max_guests, <Users className="h-4 w-4" />)}
            {properties.amenities && (
              <div className="pt-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {properties.amenities.map((amenity: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-bold rounded-full text-gray-700 dark:text-gray-300">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      case 'RECORDING_STUDIO':
        return (
          <>
            {renderProperty('Studio Type', properties.studio_type, <Music className="h-4 w-4" />)}
            {renderProperty('Min Hours', properties.min_hours)}
            {renderProperty('Engineer Included', properties.engineer_included, <Users className="h-4 w-4" />)}
            {properties.equipment_list && (
              <div className="pt-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Equipment</p>
                <p className="text-sm text-gray-500">{properties.equipment_list}</p>
              </div>
            )}
          </>
        );
      case 'CONFERENCE_HALL':
      case 'EVENT_VENUE':
        return (
          <>
            {renderProperty('Max Seated Capacity', properties.max_capacity_seated, <Users className="h-4 w-4" />)}
            {renderProperty('AV Equipment', properties.av_equipment, <MonitorSpeaker className="h-4 w-4" />)}
            {renderProperty('In-House Catering', properties.in_house_catering)}
          </>
        );
      case 'TOOL':
      case 'CONSTRUCTION_TOOL':
        return (
          <>
            {renderProperty('Brand', properties.brand, <Wrench className="h-4 w-4" />)}
            {renderProperty('Model', properties.model)}
            {renderProperty('Condition', properties.condition)}
            {renderProperty('Requires Operator', properties.requires_operator)}
          </>
        );
      default:
        // Generic renderer for unmapped properties
        return Object.entries(properties).map(([k, v]) => renderProperty(k.replace(/_/g, ' '), v));
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Features & Details</h2>
      <div className="space-y-1">
        {renderContent()}
      </div>
    </div>
  );
}
