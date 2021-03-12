import { expect } from "chai";
import * as fs from "fs";
import {
    TestDataOrdersService, ORDERS_DATA
} from "./TestDataOrdersService";
import { OrderRefBuilder } from "../src/OrderRefBuilder";
import { take } from "rxjs/operators";

describe('OrderRefBuilder', () => {
    it('should return valid refs', async () => {
        const service = new TestDataOrdersService();
        const refBuilder = new OrderRefBuilder(service);

        const refs = await new Promise((resolve, reject) => {
            refBuilder.onChange.pipe(
                take(1),
            ).subscribe(refs => {

                fs.writeFileSync("output/refs.json", JSON.stringify(refs));

                refBuilder.dispose();

                resolve(refs);
            }, err => {
                reject(err);
            });
            
            refBuilder.onProgress.subscribe(progress => {
                console.log(progress);
            });

            refBuilder.get();
        });

        expect(JSON.stringify(refs)).to.equal(JSON.stringify({
            orders: ORDERS_DATA,
        }));
    });
});
