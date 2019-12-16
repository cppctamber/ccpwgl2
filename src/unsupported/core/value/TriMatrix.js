import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("TriMatrix", true)
@meta.todo("Should this default to a identity matrix?")
export class TriMatrix extends Tw2BaseClass
{

    @meta.black.float
    _11 = 0;

    @meta.black.float
    _12 = 0;

    @meta.black.float
    _13 = 0;

    @meta.black.float
    _14 = 0;

    @meta.black.float
    _21 = 0;

    @meta.black.float
    _22 = 0;

    @meta.black.float
    _23 = 0;

    @meta.black.float
    _24 = 0;

    @meta.black.float
    _31 = 0;

    @meta.black.float
    _32 = 0;

    @meta.black.float
    _33 = 0;

    @meta.black.float
    _34 = 0;

    @meta.black.float
    _41 = 0;

    @meta.black.float
    _42 = 0;

    @meta.black.float
    _43 = 0;

    @meta.black.float
    _44 = 0;

}
