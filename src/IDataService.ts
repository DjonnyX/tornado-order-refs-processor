import { Observable } from "rxjs";
import { IRef, IOrder } from "@djonnyx/tornado-types";

export interface IDataService {
    getRefs(): Observable<Array<IRef>>;

    getOrders(): Observable<Array<IOrder>>;
}