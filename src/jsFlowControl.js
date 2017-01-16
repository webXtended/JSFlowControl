var JSFlow = (function() {

    var FlowUtils = {
        isArray: function isArray(param){
            return this.matchTypes(param, "Array");
        },
        isObject: function isObject(param){
            return this.matchTypes(param, "Object");
        },
        isFunction: function isFunction(param){
            return this.matchTypes(param, "Function");
        },
        matchTypes: function matchTypes(param, type){
           return (Object.prototype.toString.call(param) === '[object '+ type +']');
        }
    };

    var context = window;

    BlockType = {
         SINGLE: "single",
         DECISION: "decision",
    };

    var addBlockType = function(name, constructor){
        BlockType[name] = constructor;
    }

    var getBlockConstructor = function(name){
        return BlockType[name];
    }

    function Flow() {
        var name, blocks = {}, sequence = {}, currentBlock, currentSequence;

        this.getName = function(){
            return name;
        };

        this.setName = function(instanceName){
            name = instanceName;
        };

        this.getBlocks = function() {
            return blocks;
        };

        this.initBlock = function(data){
            blocks = data;
        }

        this.initSequence = function(data){
            sequence = data;
        }

        this.getSequence = function(name) {
            return sequence[name];
        };

        this.getAllSequence = function() {
            return sequence;
        };

        this.getCurrentBlock = function() {
            return currentBlock;
        };

        this.getCurrentSequence = function() {
            return currentSequence;
        };
    }

    var flows = {};

    Flow.prototype.serialize = function(){
        var result = {};
        result.name = this.getName();
        result.blocks = this.getBlocks();
        result.sequence = this.getAllSequence();
        return JSON.stringify(result);
    }

    Flow.prototype.next = function next() {

    };

    Flow.prototype.decide = function decide(fn) {
      //return block name
    };

    Flow.prototype.addBlock = function (name, options){
        var blocks = this.getBlocks();
        if(options.type){
            var block = getBlockConstructor(options.type);
            block = block.getInstance(name);
            blocks[name] = {};
            blocks[name].instance = block;
            blocks[name].options = options;
        }else{
              blocks[name] = {};
              blocks[name].fn = options.fn;
              blocks[name].options = options;
              blocks[name].type = 'simple';
        }
        return this;
    };

    Flow.prototype.updateBlock = function(name, options){
        var block = this.getBlocks()[name];
        if(block){
            for(var key in options){
                blocks[name][key] = options[key];
            }
        }else{
            console.log("block not found");
        }
        return this;
    };

    Flow.prototype.link = function link(from, to) {
      var sequence = this.getAllSequence();
      sequence[from] = {};
      sequence[from].nextBlock = to;
      return this;
    };

    Flow.prototype.unLink = function(from, to){
        var sequence = this.getAllSequence();
        if(sequence[from]){
            sequence[from] = undefined;
        }
        return this;
    }

    Flow.prototype.branch = function branch(from, to, fn, options){
      var blocks = this.getBlocks();
      if(blocks[from]){
         blocks[from].data = blocks[from].data || {};
         blocks[from].data.branches = blocks[from].data.branches || {};
         blocks[from].data.branches[to] = {};
         blocks[from].data.branches[to].fn = fn;
         blocks[from].data.branches[to].options = options;
      }else{
        console.log("branch starting point not found");
      }
    }

    Flow.prototype.addDecision = function addDecision(name, fn) {

    };

    Flow.prototype.goToBlock = function goToBlock(blockId){

    };

    Flow.prototype.runPath = function(from, to, params){
         var block = this.getBlocks()[from];
         if(block && block.data && block.data.branches && block.data.branches[to]){
            this.startFlow(to, params);

         }else{
            console.log("run end points not found");
         }

    };

    Flow.prototype.startFlow = function(from, params, context){
      console.log("flow started");
      if(this.getBlocks()[from]){
          move(this, from, params, context);
      }else{
        console.log("starting point not found");
      }
    };


    function hasBranch(flow, from){
        var block = flow.getBlocks()[from];
        if(block && block.data && block.data.branches){
            return true;
        }else{
            return false;
        }

    }

    function findBranch(flow, from, matchValue){
        var block = flow.getBlocks()[from];
        if(block && block.data && block.data.branches){
            var branches = block.data.branches;
            for(var branch in branches){
                if(branches[branch].options && branches[branch].options.pathValue === matchValue){
                    return {
                        name: branch,
                        branch: branches[branch]
                     };
                }
            }
        }else{
            return false;
        }
    }

    function move(flow, from, params, context){
      if(flow.getAllSequence()[from]){
          if(flow.getBlocks()[from]){
             execute(flow, from, params, context, function(params){
                if(flow.getBlocks()[from].blockType === BlockType.DECISION){
                    return;
                }else{
                   var nextBlock = flow.getAllSequence()[from].nextBlock;
                   move(flow, nextBlock, params, context);
                }
             });
          }else{
            console.log("block not found");
          }
      }else if(hasBranch(flow, from)){
             execute(flow, from, params, context, function(result){
                var branch = findBranch(flow, from, result);
                    if(branch){
                        move(flow, branch.name, result, context);
                    }else{
                        console.log("no branches found");
                    }

              //     var nextBlock = flow.getAllSequence()[from].nextBlock;
               //    move(flow, nextBlock, params, context);
                });


            //move(flow, branch.name, params, context);
      }else if(flow.getBlocks()[from]){
          execute(flow, from, params, context, function(){
            console.log("sequence ended");
          });
      }else{
        console.log("no block to move to");
      }
    }

//    function execute(flow, blockName, params, context, callback){
//        var result = run();
//
//        if(FlowUtils.isFunction(callback)){
//            setTimeout(callback.bind(context, result),0);
//        }
//
//        function run(){
//            var result,
//                blockData = flow.getBlocks()[blockName];
//
//            context = context||blockData.context||window;
//            if(blockData.type === 'simple'){
//                if(FlowUtils.isArray(params)){
//                    result = blockData.fn.apply(context, params);
//                }else{
//                    result = blockData.fn.call(context, params);
//                }
//                return result;
//            }else{
//                var instance = block.instance;
//                instance.onProcessComplete = function(){
//                    var previousFn = instance.getProcessCompletionCallback();
//                }
//                result = blockData.instance.trigger();
//            }
//           return;
//        }
//    }

    function execute(flow, blockName, params, context, callback){
        var blockData = flow.getBlocks()[blockName];
        if(blockData.type === 'simple'){
            var result = run();
            if(FlowUtils.isFunction(callback)){
                setTimeout(callback.bind(context, result),0);
            }
        }else{
            runBlock();
        }

        function run(){
            var fn = FlowUtils.isFunction(blockData.fn)?blockData.fn:window[blockData.fn];
            if(FlowUtils.isFunction(fn)){
                if(FlowUtils.isArray(params)){
                    result = fn.apply(context, params);
                }else{
                    result = fn.call(context, params);
                }
                return result;
            }else{
                console.log('function not found');
                return;
            }
        }

        function runBlock(){
            var result,
                blockData = flow.getBlocks()[blockName];

            context = context||blockData.context||window;
                var instance = blockData.instance;
                var previousCompleteFn = instance.getProcessCompletionCallback();
                instance.onProcessComplete = function(resp){
                     if(FlowUtils.isFunction(callback)){
                         setTimeout(callback.bind(context, resp),0);
                     }
                     if(previousCompleteFn && typeof previousCompleteFn === 'function'){
                        previousCompleteFn();
                     }
                }
                result = blockData.instance.trigger(params, context);
           return;
        }
    }


    function getFlowInstance(instance) {
        if (flows[instance]) {
            return flows[instance];
        } else {
            if(this === api){
                var flow = new Flow();
                flow.setName(instance);
                flows[instance] = flow;
                return flow;
            }else{
                var flow = Flow.call(this);
                flows[instance] = flow;
                return flow;
            }
        }
    }

    function getDeserializedInstance(data){
        data = JSON.parse(data);
        var instance = getFlowInstance(data.name);
        instance.initBlock(data.blocks);
        instance.initSequence(data.sequence);
        return instance;
    }

    var api = {
                getInstance : getFlowInstance,
                addBlockType: addBlockType,
                getDeserializedInstance: getDeserializedInstance
              };

  return api;

})();
