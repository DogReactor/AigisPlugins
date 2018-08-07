

let pros = []
let cons = []
function run(pluginHelper) {

    pluginHelper.sendMessage('request', (response) => {
        response.Pros.forEach(pro => {
            pros.push(pro)
        });

        response.Cons.forEach(con => {
            cons.push(con)
        });

      });
}

new Vue({
    el: '#app',
    data: function() {
      return {
          pros,
          cons
      }
    }
  })
module.exports = {run: run}