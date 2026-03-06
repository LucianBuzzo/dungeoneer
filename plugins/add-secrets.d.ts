import Room from '../room';
import Tile from '../tile';
type PluginContext = {
    rooms: Room[];
    tiles: Array<Tile[]>;
    oneIn: (num: number) => boolean;
};
type AddSecretsOptions = {
    inverseChance?: number;
    maxCount?: number;
};
declare const addSecrets: (options?: AddSecretsOptions) => ({ rooms, tiles, oneIn }: PluginContext) => void;
export default addSecrets;
