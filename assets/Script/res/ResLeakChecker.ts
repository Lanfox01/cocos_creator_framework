/**
 * 资源泄露检查类，可以用于跟踪资源的引用情况
 * 
 * 2021-1-31 by 宝爷
 */

import { Asset } from "cc";
import { ResUtil } from "./ResUtil";

// 这行代码定义了一个名为 FilterCallback 的类型别名。它表示一个函数类型，该函数接受一个参数 asset，类型为 Asset，并返回一个布尔值。这个函数通常用于过滤资产。
export type FilterCallback = (asset: Asset) => boolean;

/*
这部分代码是模块扩展的语法，它扩展了名为 "cc" 的模块。在 TypeScript 中，通过 declare module 可以扩展已存在的模块，并在其中添加新的类型定义或声明。
在这个模块扩展中，我们对 Asset 接口进行了扩展。Asset 是 Cocos Creator 中表示资源的基础接口。
我们为 Asset 添加了两个可选的属性：
traceMap?: Map<string, number>;: 这是一个可选属性，表示资源的追踪映射，其中键是字符串，值是数字。它用于跟踪资源的相关信息。
resetTrace?: () => void;: 这也是一个可选属性，表示重置资源的追踪。它是一个函数类型，没有参数和返回值。
*/
declare module "cc" {
    interface Asset {
        traceMap?: Map<string, number>;
        resetTrace?: () => void;
    }
}

export class ResLeakChecker {
    public resFilter: FilterCallback | null = null;    // 资源过滤回调
    private _checking: boolean = false;
    private traceAssets: Set<Asset> = new Set<Asset>();

    /**
     * 检查该资源是否符合过滤条件
     * @param url 
     */
    public checkFilter(asset: Asset): boolean {
        if (!this._checking) {
            return false;
        }
        if (this.resFilter) {
            return this.resFilter(asset);
        }
        return true;
    }

    /**
     * 对资源进行引用的跟踪
     * @param asset 
     */
    public traceAsset(asset: Asset) {
        if (!asset || !this.checkFilter(asset)) {
            return;
        }
        if (!this.traceAssets.has(asset)) {
            asset.addRef();
            this.traceAssets.add(asset);
            this.extendAsset(asset);
        }
    }

    /**
     * 扩展asset，使其支持引用计数追踪
     * @param asset 
     */
    public extendAsset(asset: Asset) {
        let addRefFunc = asset.addRef;
        let decRefFunc = asset.decRef;
        let traceMap = new Map<string, number>();
        asset.traceMap = traceMap;
        asset.addRef = function (...args: any): Asset {
            let stack = ResUtil.getCallStack(1);
            let cnt = traceMap.has(stack) ? traceMap.get(stack)! + 1 : 1;
            traceMap.set(stack, cnt);
            return addRefFunc.apply(asset, args);
        }
        asset.decRef = function (...args: any): Asset {
            let stack = ResUtil.getCallStack(1);
            let cnt = traceMap.has(stack) ? traceMap.get(stack)! + 1 : 1;
            traceMap.set(stack, cnt);
            return decRefFunc.apply(asset, args);
        }
        asset.resetTrace = () => {
            asset.addRef = addRefFunc;
            asset.decRef = decRefFunc;
            delete asset.traceMap;
        }
    }

    /**
     * 还原asset，使其恢复默认的引用计数功能
     * @param asset 
     */
    public resetAsset(asset: Asset) {
        if (asset.resetTrace) {
            asset.resetTrace();
        }
    }

    public untraceAsset(asset: Asset) {
        if (this.traceAssets.has(asset)) {
            this.resetAsset(asset);
            asset.decRef();
            this.traceAssets.delete(asset);
        }
    }

    public startCheck() { this._checking = true; }
    public stopCheck() { this._checking = false; }
    public getTraceAssets(): Set<Asset> { return this.traceAssets; }

    public reset() {
        this.traceAssets.forEach(element => {
            this.resetAsset(element);
            element.decRef();
        });
        this.traceAssets.clear();
    }

    public dump() {
        this.traceAssets.forEach(element => {
            let traceMap: Map<string, number> | undefined = element.traceMap;
            if (traceMap) {
                traceMap.forEach((key, value) => {
                    console.log(`${key} : ${value} `);                    
                });
            }
        })
    }
}
