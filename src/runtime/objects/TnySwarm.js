import { meta } from "utils";
import { TnyShip } from "./TnyShip";


/**
 * A swarm - sof `buildClass` 3.
 *
 * Carbon's `EveSwarm` extends `EveShip2` (`EveSwarm.h:118`) and adds swarm
 * vehicle simulation on top of the ship surface, so this sits in the same
 * place.
 *
 * ccpwgl has no `EveSwarm`, and its sof builder has only one branch -
 * `buildClass === 2 ? new EveStation2() : new EveShip2()` - so a swarm hull
 * builds as an `EveShip2` today and this wraps one. The class exists so that
 * `FetchSof` can name what it built rather than silently calling a swarm a
 * ship; the simulation surface is not ported and there is nothing here to
 * suggest otherwise.
 */
@meta.define("TnySwarm")
export class TnySwarm extends TnyShip
{

    get isSwarm()
    {
        return true;
    }

}
