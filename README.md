
## DApp 

项目开发: truffle unbox react

测试网络： Rinkkeby

测试账户： MetaMask

部署： Remix

当前项目中有一个新部署的合约，可以直接用来测试运行。

### 关于部署

truffle部署的坑太多，最终决定用remix部署，如果需要重新部署请用remix部署，部署方式如下：

- ./contracts/Project.sol为合约源代码。（合约编译版本0.5.0）
- 打开MetaMask的一个账户，在remix上进行部署。
- 将得到的abi和address放入./client/src/contracts/Project.json相应的标签中即可。

### 关于运行

在client目录下输入

> npm start

如果出现缺少包的情况可以在cient目录下运行nom install <包名> --save，不过node-module中应该已经包含了所有需要的包，不需要再下载了。

