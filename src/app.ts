// interfaces
interface IEvent {
  type(): string
  machineId(): string
}

interface ISubscriber {
  handle(event: IEvent): void
}

interface IPublishSubscribeService {
  publish (event: IEvent): void
  subscribe (type: string, handler: ISubscriber): void
  unsubscribe (type: string, handler?: ISubscriber): void
}

interface IHandler {
  type: string
  handler: ISubscriber
}


// implementations
class PublishSubscribeService implements IPublishSubscribeService {
  private handlers: IHandler[] = []

  publish(event: IEvent): void {
    if(this.handlers.length === 0) return

    this.handlers
      .filter(it => it.type === event.type())
      .forEach(({handler, type}) => {
        handler.handle(event)
      })
  }

  subscribe(type: string, handler: ISubscriber): void {
    const existingHandler = this.handlers.find(it=>it.type === type)
    if(existingHandler && existingHandler.handler.constructor.name == handler.constructor.name){
      return
    }

    this.handlers.push({type, handler} as IHandler)
  }

  unsubscribe(type: string, handler?: ISubscriber): void {
    this.handlers = this.handlers.filter(it => {
      return handler
        ? it.type != type || it.handler.constructor.name != handler.constructor.name
        : it.type != type
    })
  }
}

class MachineSaleEvent implements IEvent {
  constructor(private readonly _sold: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId
  }

  getSoldQuantity(): number {
    return this._sold
  }

  type(): string {
    return 'sale'
  }
}

class MachineRefillEvent implements IEvent {
  constructor(private readonly _refill: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId
  }

  getRefillQuantity(): number {
    return this._refill
  }

  type(): string {
    return 'refill'
  }
}

class MachineSaleSubscriber implements ISubscriber  {
  public machines: Machine[]

  constructor (machines: Machine[]) {
    this.machines = machines
  }

  handle(event: MachineSaleEvent): void {
    console.log(`Sale machine ${event.machineId()} with ${event.getSoldQuantity()}`)

    for (let machine of this.machines) {
      if(machine.id === event.machineId()) {
        console.log(`Machine ${machine.id} remainer stock ${machine.stockLevel} - ${event.getSoldQuantity()} = ${machine.stockLevel - event.getSoldQuantity()}`)
        machine.stockLevel -= event.getSoldQuantity()
      } else {
        console.log(`Machine ${machine.id} remainer stock ${machine.stockLevel}`)
      }
    }

    console.log('')
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[]

  constructor (machines: Machine[]) {
    this.machines = machines
  }
  
  handle(event: MachineRefillEvent): void {
    console.log(`Refill machine ${event.machineId()} with ${event.getRefillQuantity()}`)

    for (let machine of this.machines) {
      if(machine.id === event.machineId()) {
        console.log(`Machine ${machine.id} remainer stock ${machine.stockLevel} + ${event.getRefillQuantity()} = ${machine.stockLevel + event.getRefillQuantity()}`)
        machine.stockLevel += event.getRefillQuantity()
      } else {
        console.log(`Machine ${machine.id} remainer stock ${machine.stockLevel}`)
      }
    }
    
    console.log('')
  }
}


// objects
class Machine {
  public stockLevel = 10
  public id: string

  constructor (id: string) {
    this.id = id
  }
}


// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3
  if (random < 1) {
    return '001'
  } else if (random < 2) {
    return '002'
  }
  return '003'

}

const eventGenerator = (): IEvent => {
  const random = Math.random()
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2 // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine())
  } 
  const refillQty = Math.random() < 0.5 ? 3 : 5 // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine())
}


// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [ new Machine('001'), new Machine('002'), new Machine('003') ]

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines)

  // create a machine refill event subscriber. inject the machines (all subscribers should do this)
  const refillSubscriber = new MachineRefillSubscriber(machines)

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService() // implement and fix this

  pubSubService.subscribe("sale", saleSubscriber)
  pubSubService.subscribe("refill", refillSubscriber)

  // create 5 random events
  const events = [1,2,3,4,5].map(i => eventGenerator())

  // publish the events
  events.map(e => pubSubService.publish(e))

  console.log("Yes!")
})()
