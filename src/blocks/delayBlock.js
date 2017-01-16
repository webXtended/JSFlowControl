var DelayBlock = (function() {
    var dBlocks = {};
    var counter = 1;
    var blockContext = window;

    function Block(name) {
        this.name = name;
        var delayAmount = 0;
        var processCompletionCallback;
        var context = blockContext;

        this.setDelay = function(amt){
            delayAmount = amt;
        }

        this.getDelay = function(){
            return delayAmount;
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

    Block.prototype.type = "delayBlock";

    Block.prototype.onProcessComplete = function(params){
        if(this.getProcessCompletionCallback()){
            this.getProcessCompletionCallback.call(this.getContext(), params);
        }
    };

    Block.prototype.trigger = function(params, context) {
      var now = new Date().getTime();
      var till = now + this.getDelay();
      while(now < till) {
          now = new Date().getTime();
      }
      onProcessCompleted(this, params);
    };


    function onProcessCompleted(block, params) {
        console.log(params);
        block.onProcessComplete(params);
    }

    function getDelayBlockInstance(instance) {
        if (dBlocks[instance]) {
            return dBlocks[instance];
        } else {
            var dBlock = new Block();
            instance = instance || ("delay_block_" + counter++);
            dBlocks[instance] = dBlock;
            return dBlock;
        }
    }

    var api = {
        getInstance: getDelayBlockInstance
    }

    return api;

})();
JSFlow?JSFlow.addBlockType("delayBlock", DelayBlock):'';
