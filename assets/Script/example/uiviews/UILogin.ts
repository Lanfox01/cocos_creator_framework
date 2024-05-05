import { UIView } from "../../ui/UIView";
import { uiManager } from "../../ui/UIManager";
import { UIID } from "../UIExample";
import { _decorator } from "cc";

const {ccclass} = _decorator;

@ccclass
export default class UILogin extends UIView {

    public onLogin() {
        // 连续打开2个界面
        uiManager.replace(UIID.UIHall);
        uiManager.open(UIID.UINotice);
    }
}


/*
 页面的周期：
  init();
  onOpen();
  onOpenAniOver();//每次界面Open动画播放完毕时回调


*/