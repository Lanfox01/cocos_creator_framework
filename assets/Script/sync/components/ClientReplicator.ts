import { _decorator, Component, Node, resources, Prefab, Vec3, instantiate } from 'cc';
import { NodeSync } from './NodeSync';
const { ccclass, property } = _decorator;

@ccclass('ClientReplicator')
export class ClientReplicator extends Component {
    private instanceMap: Map<number, Node> = new Map();

    private loadPrefab(path: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            resources.load(path, Prefab, (err, prefab) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(prefab as Prefab);
                }
            });
        });
    }

    //实现了一个异步方法 syncInstances，用于同步实例数据
    public async syncInstances(syncData: any[]) {
        for (const data of syncData) {
            let instanceNode = this.instanceMap.get(data.instanceId);   // 从 instanceMap 中获取与当前数据对象匹配的实例节点 instanceNode 
            if (!instanceNode) {                                        // 如果 instanceNode 不存在
                const prefab = await this.loadPrefab(data.prefabPath);  // 方法异步加载预制资源，并等待加载完成。
                instanceNode = instantiate(prefab);
                const nodeSync = (instanceNode as Node).getComponent(NodeSync);
                if (nodeSync) {
                    nodeSync.setInstanceId(data.instanceId);            // 并将其添加到 instanceMap 中
                    nodeSync.setPrefabPath(data.prefabPath);
                    this.node.addChild(instanceNode);
                    this.instanceMap.set(data.instanceId, instanceNode);
                }
            }
            instanceNode.setPosition(new Vec3(data.position.x, data.position.y, data.position.z));
            if (data.data) {
                const nodeSync = (instanceNode as Node).getComponent(NodeSync);
                if (nodeSync) {
                    nodeSync.applyDiff(data.data);              // 调用 NodeSync 组件的 applyDiff 方法，将同步数据中记录的差异数据应用到节上。
                }
            }
            console.log(`sync instance ${data.instanceId}`);
        }
    }
}