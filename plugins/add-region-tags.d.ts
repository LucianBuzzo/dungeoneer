import Room from '../room';
import Tile from '../tile';
type PluginContext = {
    rooms: Room[];
    tiles: Array<Tile[]>;
};
type AddRegionTagsOptions = {
    roomPrefix?: string;
    corridorPrefix?: string;
};
declare const addRegionTags: (options?: AddRegionTagsOptions) => ({ rooms, tiles }: PluginContext) => void;
export default addRegionTags;
