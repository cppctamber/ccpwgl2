import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("TriMatrix")
@meta.todo("Should this default to a identity matrix?")
export class TriMatrix extends Tw2BaseClass
{

    @meta.float
    _11 = 0;

    @meta.float
    _12 = 0;

    @meta.float
    _13 = 0;

    @meta.float
    _14 = 0;

    @meta.float
    _21 = 0;

    @meta.float
    _22 = 0;

    @meta.float
    _23 = 0;

    @meta.float
    _24 = 0;

    @meta.float
    _31 = 0;

    @meta.float
    _32 = 0;

    @meta.float
    _33 = 0;

    @meta.float
    _34 = 0;

    @meta.float
    _41 = 0;

    @meta.float
    _42 = 0;

    @meta.float
    _43 = 0;

    @meta.float
    _44 = 0;

}
