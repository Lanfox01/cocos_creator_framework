import { assetManager } from "cc";
import { SpriteFrame } from "cc";
import { Sprite } from "cc";
import { director, _decorator, Component, Label, Node, Prefab } from "cc";
import { ResLeakChecker } from "../res/ResLeakChecker";
import { resLoader } from "../res/ResLoader";
import { ResUtil } from "../res/ResUtil";
import { CCBoolean } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class NetExample extends Component {
    @property(CCBoolean)
    resUtilMode = true;
    @property(Node)
    attachNode: Node | null = null;
    @property(Label)
    dumpLabel: Label | null = null;
    checker = new ResLeakChecker();

    start() {
        this.checker.startCheck(); // 开启这个，就会自定义 一般调试的情况可以开启，并且配合 ResUtil.instantiate(prefab) 实例化使用
    }

    onAdd() {
        resLoader.load("prefabDir/HelloWorld", Prefab, (error: any, prefab: Prefab) => {
            if (!error) {
                let myNode = ResUtil.instantiate(prefab);
                myNode.parent = this.attachNode;
                myNode.setPosition((Math.random() * 500) - 250, myNode.position.y);
                console.log(myNode.position);
            }
        });
    }

    onSub() {
        if (this.attachNode!.children.length > 0) {
            this.attachNode!.children[this.attachNode!.children.length - 1].destroy();
        }
    }

    onAssign() {
        resLoader.load("images/test/spriteFrame", SpriteFrame, (error: Error | null, sp: SpriteFrame | null) => {
            if (error) {
                console.error(error);
                return;
            }
            this.checker.traceAsset(sp!);
            if (this.attachNode!.children.length > 0) {
                let targetNode = this.attachNode!.children[this.attachNode!.children.length - 1];
                targetNode.getComponent(Sprite)!.spriteFrame = ResUtil.assignWith(sp!, targetNode, true);
            }
        });
    }

    onClean() {
        this.attachNode!.destroyAllChildren();
    }

    onDump() {
        this.checker.dump();
        this.dumpLabel!.string = `当前资源总数:${assetManager.assets.count}`;
    }


    // 在切换场景的时候 释放所有资源 那如果 恒定资源怎办？？

    onLoadClick() {
        this.checker.reset();
        director.loadScene("example_empty");
    }

    // 这个好像不释放？
    onPreloadClick() {
        director.preloadScene("example_empty");    }
}
