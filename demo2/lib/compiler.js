const fs = require('fs')
const path = require('path')
const Parser = require('./parser')

class Compiler {
    constructor(options) {
        const { entry, output } = options
        this.entry = entry
        this.output = output
        this.modules = []
    }

    run() {
        const entryInfo = this.build(this.entry)
        this.modules.push(entryInfo)
        const { dependencies} = this.modules[0]
        if (dependencies) {
            for (const dependency in dependencies) {
                this.modules.push(this.build(dependencies[dependency]))
            }
        }
        const dependencyGraph = this.modules.reduce((graph, item) => ({
            ...graph,
            [item.filename]: {
                dependencies: item.dependencies,
                code: item.code
            }
        }), {})
        this.generate(dependencyGraph)
    }

    build(filename) {
        const { getAst, getDependencies, getCode } = Parser
        // 将文件内容转为 AST 抽象语法树
        const ast = getAst(filename)
        // 找出依赖模块
        const dependencies = getDependencies(ast, filename)
        // 将 AST 语法树转换为浏览器可执行代码
        const code = getCode(ast)
        return {
            filename,
            dependencies,
            code
        }
    }

    generate(graph) {
        const outputFilePath = path.join(this.output.path, this.output.filename)

        const bunlde = `(function(graph){
            function require(module) {
                function localRequire(relativePath) {
                    return require(graph[module].dependencies[relativePath])
                }
                var exports = {}
                ;(function(require, exports, code) {
                    eval(code)
                })(localRequire, exports, graph[module].code)
                return exports
            }
            require('${this.entry}')
        })(${JSON.stringify(graph)})`

        fs.writeFileSync(outputFilePath, bunlde, 'utf-8')
    }
}

module.exports = Compiler