import Room from '../room';
import Tile from '../tile';
type PluginContext = {
    rooms: Room[];
    tiles: Array<Tile[]>;
    randBetween: (min: number, max: number) => number;
    oneIn: (num: number) => boolean;
};
type AddChokePointsOptions = {
    inverseChance?: number;
    maxCount?: number;
};
declare const addChokePoints: (options?: AddChokePointsOptions) => ({ rooms, tiles, oneIn }: PluginContext) => void;
export default addChokePoints;
