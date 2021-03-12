import {
    ICurrency, ICompiledProduct, ICompiledOrderType, IOrderRefs, ICompiledOrder, IOrder, IOrderPosition, ICompiledOrderPosition
} from "@djonnyx/tornado-types";

export interface IDependenciesRefs {
    products: Array<ICompiledProduct>;
    orderTypes: Array<ICompiledOrderType>;
    currencies: Array<ICurrency>;
}

export class OrderBuilder {
    private _refs: IOrderRefs;

    private _compiledOrders: Array<ICompiledOrder>;
    get compiledOrders() { return this._compiledOrders; }

    private _compiledProductsDictionary: { [id: string]: ICompiledProduct } = {};
    private _compiledProducts: Array<ICompiledProduct>;
    set compiledProducts(v: Array<ICompiledProduct>) {
        if (this._compiledProducts !== v) {
            this._compiledProducts = v;

            (this._compiledProducts || []).forEach(p => {
                this._compiledProductsDictionary[p.id] = p;
            });
        }
    }
    get compiledProducts() { return this._compiledProducts; }

    private _compiledOrderTypesDictionary: { [id: string]: ICompiledOrderType } = {};
    private _compiledOrderTypes: Array<ICompiledOrderType>;
    set compiledOrderTypes(v: Array<ICompiledOrderType>) {
        if (this._compiledOrderTypes !== v) {
            this._compiledOrderTypes = v;

            (this._compiledOrderTypes || []).forEach(ot => {
                this._compiledOrderTypesDictionary[ot.id] = ot;
            });
        }
    }
    get compiledOrderTypes() { return this._compiledOrderTypes; }

    private _currenciesDictionary: { [id: string]: ICurrency } = {};
    private _currencies: Array<ICurrency>;
    set currencies(v: Array<ICurrency>) {
        if (this._currencies !== v) {
            this._currencies = v;

            (this._currencies || []).forEach(c => {
                this._currenciesDictionary[c.id] = c;
            });
        }
    }
    get currencies() { return this._currencies; }

    build(refs: IOrderRefs, dependenciesRefs: IDependenciesRefs): void {
        this.reset();

        if (!!dependenciesRefs) {
            this.compiledProducts = dependenciesRefs.products;
            this.compiledOrderTypes = dependenciesRefs.orderTypes;
            this.currencies = dependenciesRefs.currencies;
        }

        this._refs = refs;

        if (!this._refs) {
            throw Error("refs in not defined.");
        }

        if (!this._refs.orders) {
            throw Error("orders ref in not defined.");
        }

        this._refs.orders.forEach(order => {
            this._compiledOrders.push(this.getCompiledOrder(order));
        });
    }

    private getCompiledOrder(order: IOrder): ICompiledOrder {
        const compiledPositions = order.positions.map(p => this.getCompiledOrderPosition(p));

        const compiledOrder: ICompiledOrder = {
            id: order.id,
            code: order.code,
            status: order.status,
            sum: order.sum,
            discount: order.discount,
            currencyId: order.currencyId,
            currency: this._currenciesDictionary[order.currencyId],
            orderTypeId: order.orderTypeId,
            orderType: this._compiledOrderTypesDictionary[order.orderTypeId],
            positions: compiledPositions,
            lastUpdate: order.lastUpdate,
        }

        return compiledOrder;
    }

    private getCompiledOrderPosition(position: IOrderPosition): ICompiledOrderPosition {
        const compiledPosition: ICompiledOrderPosition = {
            id: position.id,
            productId: position.productId,
            product: this._compiledProductsDictionary[position.productId],
            status: position.status,
            price: position.price,
            sum: position.sum,
            discount: position.discount,
            quantity: position.quantity,
            children: position.children.map(c => this.getCompiledOrderPosition(c)),
            lastUpdate: position.lastUpdate,
        }

        return compiledPosition;
    }

    private reset(): void {
        this._compiledOrderTypesDictionary = {};
        this._compiledProductsDictionary = {};
        this._currenciesDictionary = {};

        this._compiledOrders = [];
    }

    dispose(): void {
        this._compiledOrders = null;
        this._compiledOrderTypes = null;
        this._compiledOrderTypesDictionary = null;
        this._compiledProducts = null;
        this._compiledProductsDictionary = null;
        this._currencies = null;
        this._currenciesDictionary = null;
        this._refs = null;
    }
}