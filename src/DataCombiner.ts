import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ICompiledOrder, ICompiledOrderData, RefTypes } from "@djonnyx/tornado-types";
import { OrderRefBuilder } from "./OrderRefBuilder";
import { IDependenciesRefs, OrderBuilder } from "./OrderBuilder";
import { IDataService } from "./IDataService";

export interface IDataCombinerOptions {
    getRefs: () => IDependenciesRefs;
    dataService: IDataService;
    updateTimeout: number;
}

export interface IProgress {
    total: number;
    current: number;
}

export class DataCombiner {
    private _onChange = new Subject<ICompiledOrderData>();
    readonly onChange = this._onChange.asObservable();

    private _onProgress = new Subject<IProgress>();
    readonly onProgress = this._onProgress.asObservable();

    private _refBuilder: OrderRefBuilder;
    private _orderBuilder: OrderBuilder;

    private _unsubscribe$ = new Subject<void>();

    private _delayer: any;

    set dependenciesRefs(v: IDependenciesRefs) {
        this._orderBuilder.dependenciesRefs = v;

        this._onChange.next({
            refs: {
                __raw: this._orderBuilder.refs,
                orders: this._orderBuilder.compiledOrders,
            },
        });
    }

    constructor(private _options: IDataCombinerOptions) { }

    setOrders(orders: Array<ICompiledOrder>): void {
        if (!!this._orderBuilder) {
            this._orderBuilder.setOrders(orders);
        }
    }

    setRefVersion(refName: RefTypes, version: number): void {
        if (!!this._refBuilder) {
            this._refBuilder.setRefVersion(refName, version);
        }
    }

    getRefVersion(refName: RefTypes): number {
        return !!this._refBuilder ? this._refBuilder.getRefVersion(refName) : 1;
    }

    init(): void {
        this._refBuilder = new OrderRefBuilder(this._options.dataService);
        this._orderBuilder = new OrderBuilder();

        this._refBuilder.onChange.pipe(
            takeUntil(this._unsubscribe$),
        ).subscribe(
            refs => {
                if (!!refs) {
                    this._orderBuilder.build(refs, this._options.getRefs());
                    this._onChange.next({
                        refs: {
                            __raw: refs,
                            orders: this._orderBuilder.compiledOrders,
                        },
                    });
                } else {
                    this._onChange.next(null);
                }

                this.getRefsDelayed();
            }, err => {
                console.error(err);
                this.getRefsDelayed();
            }
        );

        this._refBuilder.onProgress.pipe(
            takeUntil(this._unsubscribe$),
        ).subscribe(progress => {
            this._onProgress.next(progress);
        })

        this._refBuilder.get();
    }

    private getRefsDelayed(): void {
        clearTimeout(this._delayer);
        this._delayer = setTimeout(() => {
            if (!!this._refBuilder) {
                this._refBuilder.get();
            }
        }, this._options.updateTimeout);
    }

    dispose(): void {
        clearTimeout(this._delayer);

        if (!!this._unsubscribe$) {
            this._unsubscribe$.next();
            this._unsubscribe$.complete();
            this._unsubscribe$ = null;
        }

        if (!!this._refBuilder) {
            this._refBuilder.dispose();
            this._refBuilder = null;
        }

        if (!!this._orderBuilder) {
            this._orderBuilder.dispose();
            this._orderBuilder = null;
        }

        if (!!this._onChange) {
            this._onChange.unsubscribe();
            this._onChange = null;
        }

        if (!!this._onProgress) {
            this._onProgress.unsubscribe();
            this._onProgress = null;
        }
    }
}
