import axios from "axios";
import { chromium } from "playwright";
import * as Cheerio from "cheerio";
import {ODIN_HTML_ALARM_UPDATED_AT_REGEX, ODIN_HTML_ALARMS_TABLE_ID, ODIN_SOURCE_URL} from "../constants/OdinConstants";
import { OdinAlarm } from "../models/OdinAlarm";

export default class OdinHelper {
    retrieveAlarmsFromOdinSourceViaPlaywright = async () => {
        const browser = await chromium.launch({
            headless: true
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36 Edg/104.0.1293.54',
            extraHTTPHeaders: {
                'Host': 'www.odin.dk',
                'Upgrade-Insecure-Requests': '1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'da,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive'
            }
        })

        try {
            const page = await browser.newPage();

            await page.goto(ODIN_SOURCE_URL, {
                waitUntil: 'load',
            });

            const content = await page.content();

            return this.parseOdinAlarms(content);
        } catch (error) {
            console.log(error);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    };

    retrieveAlarmsFromOdinPuls = async () => {
        try {
            const response = await axios({
                method: 'get',
                url: ODIN_SOURCE_URL
            });

            const content = await response.data;

            return this.parseOdinAlarms(content);
        } catch (error) {
            console.error(error);
        }
    }

    parseOdinAlarms = async(htmlDom: string) => {
        var alarms: OdinAlarm[] = [];

        const $ = Cheerio.load(htmlDom);

        const lastUpdated = $("#CurrentTime").last().text();
        const matchedRegexLastUpdated = '- ' + lastUpdated.match(ODIN_HTML_ALARM_UPDATED_AT_REGEX);

        const alarmsTable = $(`#${ODIN_HTML_ALARMS_TABLE_ID}`).first();
        const alarmsTableBody = alarmsTable.find("tbody");

        alarmsTableBody.children().each((i, tableRowElement) => {
            const tableRowElementChildren = $(tableRowElement).first().children()
            const tableRowElementChildrenFilter = $(tableRowElement).first().find('th');

            if (tableRowElementChildrenFilter.length === 0 || tableRowElementChildrenFilter === null) {
                const beredskabElement = $(tableRowElementChildren)[0]
                const stationElement = $(tableRowElementChildren)[1]
                const alarmModtagetELement = $(tableRowElementChildren)[2]
                const foersteMeldingsOrdlydElement = $(tableRowElementChildren)[3]

                const beredskab = $(beredskabElement).text().trim();
                const station = $(stationElement).text().trim();
                const alarmModtaget = $(alarmModtagetELement).text().trim();
                const foersteMeldingsOrdlyd = $(foersteMeldingsOrdlydElement).text().trim();

                const alarm: OdinAlarm = {
                    beredskab: beredskab,
                    station: station,
                    alarmModtaget: alarmModtaget,
                    foersteMeldingsOrdlyd: foersteMeldingsOrdlyd
                };

                alarms.push(alarm);
            }
        });

        return [alarms, matchedRegexLastUpdated];
    }

    hasLength = (arr: any[]): boolean => {
        return arr && arr.length !== 0
    }
}