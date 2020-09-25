import { meta } from "global";


@meta.ctor("EveSOFData")
export class EveSOFData
{

    @meta.list("EveSOFDataFaction")
    faction = [];
    
    @meta.struct("EveSOFDataGeneric")
    generic = null;
    
    @meta.list("EveSOFDataHull")
    hull = [];
    
    @meta.list("EveSOFDataMaterial")
    material = [];
    
    @meta.list("EveSOFDataPattern")
    pattern = [];
    
    @meta.list("EveSOFDataRace")
    race = [];

}
