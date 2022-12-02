export class If{
    constructor(c){
        this.condition = c
    }
    Then(thenpart){
        const l1 = {timeline:thenpart, conditional_function : () => {
            var out = this.condition()
            //console.log(out == true)
            return out == true
        }}
        return new Then(this.condition,[l1])
    }
}
class Then{
    constructor(c, args)
    {
        this.condition = c
        this.args = args
    }
    Else(elsePart){
        const l2 = {timeline:elsePart, conditional_function :() => {
            var out = this.condition()
            //console.log(!out) 
            return out == false || !out
        }}
        return [this.args[0],l2]
    }
}