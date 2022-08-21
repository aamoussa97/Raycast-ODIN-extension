import { Detail } from "@raycast/api";
import {ODIN_SOURCE_INDICATION} from "./constants/OdinConstants";

export default function OdinSourceIndication() {
    return <Detail markdown={ODIN_SOURCE_INDICATION} />
}