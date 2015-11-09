import sinon from 'sinon';
import { expect } from 'chai';
import GameObject from '../src/classes/GameObject';

describe('GameObject', () => {
  it('should update', () => {
    var spy = sinon.spy();

    const object = new GameObject({
      emit: spy,
    }, {
      position: { x: 0, y: 0 },
    });

    GameObject.update(100, object);
    //expect(spy.callCount).to.equal(1);

    //const args = spy.args[0];
    //expect(args[0]).to.equal('move');
    //    expect(args[1]).to.deep.equal({
    //      position: { x: 0, y: 0 },
    //    });
  });
});
