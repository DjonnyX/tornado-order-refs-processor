import { Observable, of, interval } from "rxjs";
import { IRef, RefTypes, IOrder, OrderStatuses, OrderPositionStatuses } from "@djonnyx/tornado-types";
import { take, switchMap } from "rxjs/operators";

const currentTestDate = new Date("2020-09-11T11:18:11.284Z");

export const REFS_INFO_DATA: Array<IRef> = [
    {
        name: RefTypes.ORDERS,
        version: 1,
        lastUpdate: currentTestDate,
    },
];

export const ORDERS_DATA: Array<IOrder> = [
    {
        id: "o1",
        code: "F001",
        sum: 10000,
        discount: 1000,
        status: OrderStatuses.NEW,
        currencyId: "c1",
        orderTypeId: "ot1",
        positions: [
            {
                id: "o1p1",
                productId: "p1",
                status: OrderPositionStatuses.NEW,
                price: 10000,
                sum: 10000,
                discount: 1000,
                quantity: 1,
                children: [],
                lastUpdate: currentTestDate,
            }
        ],
        lastUpdate: currentTestDate,
    },
    {
        id: "o2",
        code: "F002",
        sum: 15000,
        discount: 1500,
        status: OrderStatuses.IN_PROCESS,
        currencyId: "c1",
        orderTypeId: "ot1",
        positions: [
            {
                id: "o2p1",
                productId: "p2",
                status: OrderPositionStatuses.IN_PROCESS,
                price: 10000,
                sum: 10000,
                discount: 1000,
                quantity: 1,
                children: [],
                lastUpdate: currentTestDate,
            },
            {
                id: "o2p2",
                productId: "p3",
                status: OrderPositionStatuses.COMPLETE,
                price: 5000,
                sum: 5000,
                discount: 500,
                quantity: 1,
                children: [],
                lastUpdate: currentTestDate,
            }
        ],
        lastUpdate: currentTestDate,
    }
];

const request = (data: any) => {
    return interval(100).pipe(
        take(1),
        switchMap(() => of(data)),
    );
}

export class TestDataOrdersService {
    getRefs(): Observable<Array<IRef>> {
        return request(REFS_INFO_DATA);
    };

    getOrders(): Observable<Array<IOrder>> {
        return request(ORDERS_DATA);
    }
}