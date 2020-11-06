const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { transformFromAst } = require('@babel/core');

const Parser = {
    getAst: path => {
        const content = fs.readFileSync(path, 'utf-8')
        return parser.parse(content, {
            sourceType: 'module'
        })
    },
    getDependencies: (ast, filename) => {
        const dependencies = {}
        traverse(ast, {
            ImportDeclaration({node}) {
                const dirname = path.dirname(filename)
                const filepath = `./${path.join(dirname, node.source.value)}`
                dependencies[node.source.value] = filepath
            }
        })
        return dependencies
    },
    getCode: ast => {
        // AST 转换为 Code
        const { code } = transformFromAst(ast, null, {
            presets: ['@babel/preset-env'],
        })
        return code
    },
}

module.exports = Parser