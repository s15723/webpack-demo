(function () {
    var moduleList = [
        // function (require, module, exports) {
        //     const moduleA = require('./moduleA')
        //     console.log('moduleA', moduleA)
        // },
        // function (require, module, exports) {
        //     module.exports = new Date().getTime()
        // }
        function (require, module, exports) {
            setTimeout(() => require.ensure('1').then(res => console.log(res)), 3000)
        }
    ]

    var moduleDepIdList = [
        { './moduleA': 1 },
        {}
    ]

    var cache = {}

    function require(id, parentId) {
        var currentModuleId = parentId !== undefined ? moduleDepIdList[parentId][id] : id
        // 当前 require 声明的 module 是给当前 require 的模块用的，用来接收 module.exports
        // 传入 moduleFunc 的 (id) => require(id, currentModuleId)，是给当前模块里再 require 其他模块用的
        // 通过闭包包含当前模块的 id 作为 parentId，以便寻找依赖
        var module = {exports: {}}
        var moduleFunc = moduleList[currentModuleId]
        moduleFunc((id) => require(id, currentModuleId), module, module.exports)
        return module.exports
    }

    require.ensure = function (chunkId, parentId) {
        var currentModuleId = parentId !== undefined ? moduleDepIdList[parentId][chunkId] : chunkId 
        var chunkStatus = cache[currentModuleId]
        if (chunkStatus === void 0) {
            var $script = document.createElement('script')
            $script.src = `chunk_${chunkId}.js`
            document.body.appendChild($script)

            var promise = new Promise(resolve => {
                var chunkCache = [resolve]
                chunkCache.status = true
                cache[currentModuleId] = chunkCache
            })
            cache[currentModuleId].push(promise)
            return promise
        }

        if (chunkStatus.status) {
            return chunkStatus[1]
        }

        return chunkStatus
    }

    window._JSONP = function(chunkId, moduleFunc) {
        var currentChunkStatus = cache[chunkId]
        var resolve = currentChunkStatus[0]
        var module = {exports: {}}
        moduleFunc(require, module, module.exports)
        resolve(module.exports)
    }
    
    moduleList[0](require, null, null)
})()