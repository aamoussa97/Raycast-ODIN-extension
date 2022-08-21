import { useEffect, useState } from "react";
import { List } from "@raycast/api";
import OdinHelper from "./helpers/OdinHelper";
import {OdinAlarm} from "./models/OdinAlarm";
import {OdinAlarmListItem} from "./odin-alarm-list-item";
import {ODIN_SOURCE_INDICATION} from "./constants/OdinConstants";
import * as crypto from "crypto";

export default function OdinAlarms() {
    const odinHelper = new OdinHelper();
    const [state, setState] = useState<{odinAlarmsModel: null | [OdinAlarm], lastUpdated: string}>({
        odinAlarmsModel: null,
        lastUpdated: ""
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [result] = await Promise.all([
                    odinHelper.retrieveAlarmsFromOdinPuls()
                ]);

                setState(prevState => ({...prevState, odinAlarmsModel: result[0], lastUpdated: result[1]}))
                setIsLoading(false)
            } catch (error: unknown) {
                console.log(error);
            }
        }

        fetchData();
    }, [state, isLoading]);

    return <>
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Filter by station, accident description or time called in."
            navigationTitle={`${ODIN_SOURCE_INDICATION} ${state.lastUpdated}`}
        >
            {!odinHelper.hasLength(state.odinAlarmsModel) ? (
                <List.EmptyView title="No alarms found." />
            ) : (
                state.odinAlarmsModel?.map((odinAlarm) => (
                    <OdinAlarmListItem key={crypto.randomUUID()} odinAlarmModel={odinAlarm}/>
                ))
            )}
        </List>
    </>
}

