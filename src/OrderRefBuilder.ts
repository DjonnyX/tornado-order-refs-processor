import { Observable, of, concat, Subject, BehaviorSubject } from "rxjs";
import { switchMap, takeUntil, take, catchError } from "rxjs/operators";
import { IRef, IOrderRefs, RefTypes } from "@djonnyx/tornado-types";
import { IDataService } from "./IDataService";

interface IProgress {
    total: number;
    current: number;
}

export class OrderRefBuilder {
    protected unsubscribe$ = new Subject<void>();

    private _refsInfoDictionary: { [refName: string]: IRef } = {};

    private _refs: IOrderRefs = {
        orders: null,
    };

    private _onChange = new Subject<IOrderRefs | null>();
    public onChange = this._onChange.asObservable();

    private _initialProgressState: IProgress = {
        total: 1,
        current: 0,
    }

    protected progressState: IProgress = {
        ...this._initialProgressState,
    }

    private _onProgress = new BehaviorSubject<IProgress>(this.progressState);
    public onProgress = this._onProgress.asObservable();

    constructor(private _service: IDataService, initialRefs?: IOrderRefs) {
        if (!!initialRefs) {
            for (const refName in initialRefs) {
                this._refsInfoDictionary[refName] = initialRefs[refName];
            }
            this._refs = initialRefs;
        }
    }

    setRefVersion(refName: RefTypes, version: number): void {
        if (!!this._refsInfoDictionary && !!this._refsInfoDictionary[refName]) {
            this._refsInfoDictionary[refName].version = version;
        }
    }

    getRefVersion(refName: RefTypes): number {
        return !!this._refsInfoDictionary && !!this._refsInfoDictionary[refName] ? this._refsInfoDictionary[refName].version || 1 : 1;
    }

    dispose(): void {
        if (!!this.unsubscribe$) {
            this.unsubscribe$.next();
            this.unsubscribe$.complete();
            this.unsubscribe$ = null;
        }

        if (!!this._onChange) {
            this._onChange.unsubscribe();
            this._onChange = null;
        }

        if (!!this._onProgress) {
            this._onProgress.unsubscribe();
            this._onProgress = null;
        }

        this._refsInfoDictionary = null;
        this._refs = null;
    }

    private _refsInfo: Array<IRef>;

    get(): Observable<IOrderRefs | null> {
        try {
            this._service.getRefs().pipe(
                take(1),
                takeUntil(this.unsubscribe$),
            ).subscribe(
                res => {
                    this._refsInfo = res;
                    this.checkForUpdateRefs(res);
                },
                err => {
                    this.checkForUpdateRefs(this._refsInfo);
                }
            );
        } catch (err) {
            console.error(err);
            this.checkForUpdateRefs(this._refsInfo);
        }

        return this.onChange;
    }

    private normalizedRequestName(requestName: string): string {
        let result = "";
        const pattern = /([A-Z])/g;

        if (pattern.test(requestName)) {
            for (const char of requestName) {
                if (pattern.test(char)) {
                    result += `-${char.toLowerCase()}`;
                } else {
                    result += char;
                }
            }
        }

        return result;
    }

    private checkForUpdateRefs(refsInfo: Array<IRef> | null): void {
        if (!refsInfo) {
            this._onChange.next(null);
            return;
        }

        let sequenceList = new Array<Observable<any>>();

        if (!refsInfo["orders"]) {
            refsInfo["orders"] = {
                version: 1,
            }
        }

        refsInfo.forEach(refInfo => {
            let refName = refInfo.name;

            if (/^(orders)$/.test(refName)) {
                if (!this._refsInfoDictionary[refName] || this._refsInfoDictionary[refName].version !== refInfo.version) {
                    const res = this.updateRefByName(refName);
                    sequenceList.push(res);
                }
            }

            this._refsInfoDictionary[refName] = refInfo;
        });

        if (sequenceList.length === 0) {
            this._onChange.next(null);
            return;
        }

        const refs = [];

        this.progressState = { ...this._initialProgressState };
        this._onProgress.next(this.progressState);

        concat(...sequenceList).subscribe(
            (needUpdate) => {
                this.progressState.current++;
                this._onProgress.next(this.progressState);
                refs.push(needUpdate);
            },
            (err) => {
                console.error(`Download ref error. ${err}`);
            },
            () => {
                let needRebuild = false;

                refs.forEach(val => {
                    if (val) {
                        needRebuild = true;
                    }
                });

                if (needRebuild) {
                    this._onChange.next(this._refs);
                } else {
                    this._onChange.next(null);
                }
            }
        );
    }

    private updateRefByName(refName: string): Observable<boolean> {
        const req = this.fetchRefByName(refName);

        if (!req) {
            return of(false);
        }

        return req.pipe(
            takeUntil(this.unsubscribe$),
            catchError(err => {
                console.error(err);
                return of(false);
            }),
            switchMap(res => {
                if (res) {
                    this._refs[refName] = res;
                    return of(true);
                }

                return of(false);
            }),
        );
    }

    private fetchRefByName(refName: string): Observable<any> | null {
        switch (refName) {
            case "orders":
                return this._service.getOrders();
        }

        return null;
    }
}