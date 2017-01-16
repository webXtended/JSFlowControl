var ParallelBlock = (function() {
    var pBlocks = {};
    var blockContext = window;

    function Block(name) {
        var operations = {},
            queue = [];
            executionQueue = [];
        this.name = name;
        var context = blockContext;
        var processCompletionCallback;

        this.getOperations = function() {
            return operations;
        }

        this.getQueue = function() {
            return queue;
        }

        this.setExecutionQueue = function(arr){
            executionQueue = arr;
        }

        this.getExecutionQueue = function(){
            return executionQueue;
        }

        this.addToQueue = function(name) {
            if (queue.indexOf(name) === -1) {
                queue.push(name);
            }
        }

        this.removeFromQueue = function(name){
            var index = queue.indexOf(name);
            if(index !== -1){
                queue.splice(index,1);
            }
        }

        this.setProcessCompletionCallback = function(fn){
            if(fn && typeof fn === 'function'){
                processCompletionCallback = fn;
            }
        }

        this.getProcessCompletionCallback = function(){
            return processCompletionCallback;
        }

        this.setContext = function(c) {
            context = c;
        }

        this.getContext = function() {
            return context;
        }
    }

    Block.prototype.type = "parallelBlock";

    Block.prototype.onProcessComplete = function(params){
        if(this.getProcessCompletionCallback()){
            this.getProcessCompletionCallback.call(this.getContext(), params);
        }
    };

    Block.prototype.addOperation = function(name, fn) {
        var operations = this.getOperations();
        operations[name] = operations[name] || {};
        operations[name].fn = fn;
        this.addToQueue(name);
        return this;
    };

    Block.prototype.removeOperation = function(name){
        var operations = this.getOperations();
        operations[name] = undefined;
        this.removeFromQueue(name);
        return this;
    };

    Block.prototype.removeAllOperations = function(){
        var operations = this.getOperations();
        for(var op in operations){
            this.removeOperation(op);
        }
    };

    Block.prototype.trigger = function(params, context) {
        var operations = this.getOperations();
        var queue = this.getQueue();
        this.setExecutionQueue(JSON.parse(JSON.stringify(queue)));
        var that = this;
        params = params || {};

        if(queue.length === 0){
            this.onProcessComplete(params);
            return;
        }

        for (var key in operations) {
            if(operations.hasOwnProperty(key)){
                setTimeout(performOperation.bind(that, key, operations[key], params[key] || {}),0);
            }
        }
    };


    function performOperation(name, operation, params) {
        var context = params.context || this.getContext();
        var args = params.params || [];
        args.push((function(response) {
            processResponse(this.name, response, this.block, params);
        }).bind({
            name: name,
            block: this
        }));
        operation.fn.apply(context, args);
    }

    var processResponse = (function(){
        var finalResponse = {};

        return function(name, response, block, params){
//            var queue = block.getQueue();
            var queue = block.getExecutionQueue();
            var index = queue.indexOf(name);
            queue.splice(index, 1);
            finalResponse[name] = {};
            finalResponse[name].params = params;
            finalResponse[name].response = response;
            if (queue.length > 0) {
                return;
            } else {
                onProcessCompleted(block, finalResponse);
            }
        };

    })();

    function onProcessCompleted(block, params) {
        console.log(params);
        block.onProcessComplete(params);
    }

    Block.prototype.startFlow = function() {
        console.log("Block flow started");
        var operations = this.getOperations();
        var queue = this.getQueue();

        for (var key in operations) {
            setTimeout(function() {
                operations[key].fn();
            }, 0);
        }
    };

    Block.prototype.addBlock = function(name, fn) {
        this.blocks[name] = fn;
        uber.addBlock.call(this, name, fn);
    }

    function getParallelBlock() {
        var blockNumber = parallelFlowCount++;
        var parallelFlow = Block(blockNumber);
    }

    function getParallelFlowInstance(instance) {
        if (pBlocks[instance]) {
            return pBlocks[instance];
        } else {
            var pBlock = new Block(instance);
            pBlocks[instance] = pBlock;
            return pBlock;
        }
    }

    var api = {
        getInstance: getParallelFlowInstance
    }

    return api;

})();

JSFlow?JSFlow.addBlockType("parallelBlock", ParallelBlock):'';
