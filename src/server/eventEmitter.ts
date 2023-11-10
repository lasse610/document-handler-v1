import { EventEmitter } from "events";

const ee = new EventEmitter();
ee.setMaxListeners(1000);
export default ee;
