var HelloWorldLayer = cc.Layer.extend({
    sprite: null,
    ctor: function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;

        let scores = null;
        let moves = null;
        let barEl = null;
        let mtBar = null;
        let money = null;
        let bomber = null;

        let minBlastable = 2;

        let scoresToGetNum = 750;
        let moneyNum = 5;
        let movesRemaining = 25;
        let scoresNum = 0;

        let shuffles = 3;

        let bombBooster = {

            price: 5,
            radius: 3,
            active: false
        }

        let blockSizeX = 46;
        let blockSizeY = 50;

        let gameSizeX = 9;
        let gameSizeY = 9;

        let blockColors = [

            res.blueBlock,
            res.purpleBlock,
            res.yellowBlock,
            res.redBlock,
            res.greenBlock
        ];

        let layer = this;

        //colored block click handle
        let blockClickHandle = cc.EventListener.create({

            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,

            onTouchBegan: function (touch, event) {

                let target = event.getCurrentTarget();

                let locationInNode = target.convertToNodeSpace(touch.getLocation());
                let s = target.getContentSize();
                let rect = cc.rect(0, 0, s.width, s.height);

                if (cc.rectContainsPoint(rect, locationInNode)) {

                    return true;
                }
                return false;
            },
            onTouchEnded: function (touch, event) {

                let clickedBlock = event.getCurrentTarget();

                if (movesRemaining < 1) {

                    alert('Вы проиграли!');
                    return;
                }

                if (scoresNum > scoresToGetNum) {

                    alert('Вы выиграли!');
                    return;
                }

                let parent = clickedBlock.parent;
                let clickedTile = getTileByBlock(map, clickedBlock);
                let tileXIndex = map.indexOf(clickedTile) % gameSizeX;
                let tileYIndex = Math.floor(map.indexOf(clickedTile) / gameSizeX);


                if (bombBooster.active) {

                    let toBomb = bombBlocks(map, tileXIndex, tileYIndex, bombBooster.radius, gameSizeX, gameSizeY);

                    scoresNum += toBomb.length * 7;

                    let scaleAnim = new cc.ScaleBy(0.1, 1.5);
                    let rotate = new cc.RotateTo(0.5, 180);
                    let moveAnim = new cc.MoveTo(0.5, 750, 300);
                    let scaleDownAnim = new cc.ScaleBy(0.1, 0);

                    let scoreZoomAnim = new cc.ScaleTo(0.2, 1);
                    let scoreUnZoomAnim = new cc.ScaleTo(0.2, 0.5);

                    let sequence = cc.Sequence.create(
                        scaleAnim.clone(),
                        rotate.clone(),
                        moveAnim.clone(),
                        scaleDownAnim.clone(),
                        cc.callFunc(() => scores.setString(scoresNum)),
                        cc.callFunc(() => scores.runAction(cc.Sequence.create(scoreZoomAnim, scoreUnZoomAnim))),
                        cc.callFunc(() => parent._children.filter(e => e.checkedd && e.x > 700 && e.x < 800).forEach(e => { parent.removeChild(e) })),
                        cc.callFunc(() => {

                            if ((scoresNum / scoresToGetNum) > 0.975) {

                                barEl.setScaleX((97.5 / mtBar.getBoundingBox().width));
                            } else {

                                barEl.setScaleX((scoresNum / scoresToGetNum) * (97.5 / mtBar.getBoundingBox().width));
                            }
                        }),
                        cc.callFunc(() => {

                            if (scoresNum > scoresToGetNum) {

                                alert('Вы выиграли!');
                                return;
                            }
                        })
                    );

                    toBomb.forEach(e => {

                        e.block.checkedd = true;
                        e.block._localZOrder = 10;
                        e.block.runAction(sequence.clone());
                    });

                    map.filter(e => e.block && e.block.checkedd).forEach(e => e.block = null);
                    moveBlocksDown(map, gameSizeX, gameSizeY, blockSizeY);
                    parent.spawNewBlocks(map, gameSizeX, gameSizeY, blockColors, blockSizeX, blockSizeY, blockClickHandle);

                    bombBooster.active = false;

                    return;
                }


                countSimilarBlocks(map, tileXIndex, tileYIndex, clickedBlock.colorID, gameSizeY, gameSizeX)

                let group = map.filter(e => e.block && e.block.checkedd);


                if (group.length > minBlastable) {

                    movesRemaining--;
                    moves.setString(movesRemaining);
                    scoresNum += group.length * 7;

                    let scaleAnim = new cc.ScaleBy(0.1, 1.5);
                    let moveAnim = new cc.MoveTo(0.5, 750, 300);
                    let scaleDownAnim = new cc.ScaleBy(0.1, 0);

                    let scoreZoomAnim = new cc.ScaleTo(0.2, 1);
                    let scoreUnZoomAnim = new cc.ScaleTo(0.2, 0.5);

                    let sequence = cc.Sequence.create(
                        scaleAnim.clone(),
                        moveAnim.clone(),
                        scaleDownAnim.clone(),
                        cc.callFunc(() => scores.setString(scoresNum)),
                        cc.callFunc(() => scores.runAction(cc.Sequence.create(scoreZoomAnim, scoreUnZoomAnim))),
                        cc.callFunc(() => parent._children.filter(e => e.checkedd && e.x > 700 && e.x < 800).forEach(e => { parent.removeChild(e) })),
                        cc.callFunc(() => {

                            if ((scoresNum / scoresToGetNum) > 0.975) {

                                barEl.setScaleX((97.5 / mtBar.getBoundingBox().width));
                            } else {

                                barEl.setScaleX((scoresNum / scoresToGetNum) * (97.5 / mtBar.getBoundingBox().width));
                            }
                        })
                    );

                    group.forEach(e => {

                        e.block._localZOrder = 10;
                        e.block.runAction(sequence.clone());
                    });

                    map.filter(e => e.block && e.block.checkedd).forEach(e => e.block = null);
                    moveBlocksDown(map, gameSizeX, gameSizeY, blockSizeY);
                    parent.spawNewBlocks(map, gameSizeX, gameSizeY, blockColors, blockSizeX, blockSizeY, blockClickHandle);

                    if (!isPossibleToGo(map, minBlastable, gameSizeX, gameSizeY)) {

                        if (shuffles < 1) {

                            alert('вы проиграли!!');
                            return;
                        }
                        shuffleBlocks(map, minBlastable, gameSizeX, gameSizeY);
                        shuffles--;
                    }
                } else {

                    group.forEach(e => e.block.checkedd = false);
                }
            }
        });

        //bomb handle
        let bombHandle = cc.EventListener.create({

            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,

            onTouchBegan: function (touch, event) {

                let target = event.getCurrentTarget();

                let locationInNode = target.convertToNodeSpace(touch.getLocation());
                let s = target.getContentSize();
                let rect = cc.rect(0, 0, s.width, s.height);

                if (cc.rectContainsPoint(rect, locationInNode)) {

                    return true;
                }
                return false;
            },
            onTouchEnded: function () {

                if (movesRemaining < 1) {

                    alert('вы проиграли!!');
                    return;
                }

                if (scoresNum > scoresToGetNum) {

                    alert('вы выиграли!!');
                    return;
                }

                if (bombBooster.active) {

                    return;
                }

                if (moneyNum - bombBooster.price < 0) {

                    alert('у вас не хватает денег');
                    return;
                }

                moneyNum -= bombBooster.price;
                money.setString(moneyNum);
                bombBooster.active = true;
            }
        });

        //set UI
        this.setUI(size, scoresToGetNum, moneyNum, movesRemaining, scoresNum, bombBooster);

        scores = this.getChildByTag('scoresText');
        moves = this.getChildByTag('movesText');
        barEl = this.getChildByTag('barEl');
        mtBar = this.getChildByTag('mtBar');
        money = this.getChildByTag('money');
        bomber = this.getChildByTag('bombBoost');

        cc.eventManager.addListener(bombHandle.clone(), bomber);

        //create field
        let map = createField(gameSizeX, gameSizeY, blockSizeX, blockSizeY, 50, size.height - 74);

        //create blocks
        map.forEach(e => {

            e.block = this.createBlock(blockColors, e.x, e.y, blockSizeX, blockSizeY, blockClickHandle);
            this.addChild(e.block);
        });

        if (!isPossibleToGo(map, minBlastable, gameSizeX, gameSizeY)) {

            shuffleBlocks(map, minBlastable, gameSizeX, gameSizeY);
        }

        return true;
    },
    setUI: function (size, scoresToGetNum, moneyNum, movesRemaining, scoresNum, bombBooster) {

        //set background
        let background = new cc.Sprite.create(res.bcgImage);
        background.setAnchorPoint(cc.p(0.5, 0.5));
        background.setPosition(cc.p(size.width / 2, size.height / 2));
        this.addChild(background, 0);

        //set infoBar
        let levelInfoBarBcg = new cc.Sprite.create(res.levelInfoBarBcg);
        levelInfoBarBcg.setAnchorPoint(cc.p(0.5, 1));
        levelInfoBarBcg.setPosition(cc.p(size.width / 2 - 15, size.height));
        levelInfoBarBcg.setScaleX(763 / levelInfoBarBcg.getBoundingBox().width);
        levelInfoBarBcg.setScaleY(85 / levelInfoBarBcg.getBoundingBox().height);

        this.addChild(levelInfoBarBcg, 0);

        //set pauseBtn
        let pauseBtn = new cc.Sprite.create(res.pauseBtn);
        pauseBtn.setAnchorPoint(cc.p(1, 1));
        pauseBtn.setPosition(cc.p(size.width - 10, size.height - 5));
        pauseBtn.setScaleX(80 / pauseBtn.getBoundingBox().width);
        pauseBtn.setScaleY(80 / pauseBtn.getBoundingBox().height);

        this.addChild(pauseBtn, 0);

        let gameFieldBcg = new cc.Sprite.create(res.gameFieldBcg);
        gameFieldBcg.setAnchorPoint(cc.p(0, 1));
        gameFieldBcg.setPosition(cc.p(0 + 35, size.height - 110));
        gameFieldBcg.setScaleX(445 / gameFieldBcg.getBoundingBox().width);
        gameFieldBcg.setScaleY(481 / gameFieldBcg.getBoundingBox().height);

        this.addChild(gameFieldBcg, 0);

        let scoresContBcg = new cc.Sprite.create(res.scoresContBcg);
        scoresContBcg.setAnchorPoint(cc.p(0, 1));
        scoresContBcg.setPosition(cc.p(0 + 590, size.height - 140));
        scoresContBcg.setScaleX(310 / scoresContBcg.getBoundingBox().width);
        scoresContBcg.setScaleY(270 / scoresContBcg.getBoundingBox().height);

        this.addChild(scoresContBcg, 0);


        let scoreToGetBcg = new cc.Sprite.create(res.pinkRect);
        scoreToGetBcg.setAnchorPoint(cc.p(0.5, 0.5));
        scoreToGetBcg.setPosition(cc.p(170, size.height - 35));
        scoreToGetBcg.setScaleX(100 / scoreToGetBcg.getBoundingBox().width);
        scoreToGetBcg.setScaleY(40 / scoreToGetBcg.getBoundingBox().height);

        this.addChild(scoreToGetBcg, 0);

        let scoreToGet = new cc.LabelTTF(scoresToGetNum, 'Impact');
        scoreToGet.setFontSize(100);
        scoreToGet.setAnchorPoint(cc.p(0.5, 0.5));
        scoreToGet.setPosition(cc.p(170, size.height - 38));
        scoreToGet.setScaleX(20 / scoreToGetBcg.getBoundingBox().width);
        scoreToGet.setScaleY(10 / scoreToGetBcg.getBoundingBox().height);

        this.addChild(scoreToGet, 0);

        let moneyBcg = new cc.Sprite.create(res.purpleRect);
        moneyBcg.setAnchorPoint(cc.p(0.5, 0.5));
        moneyBcg.setPosition(cc.p(size.width - 250, size.height - 35));
        moneyBcg.setScaleX(130 / moneyBcg.getBoundingBox().width);
        moneyBcg.setScaleY(40 / moneyBcg.getBoundingBox().height);

        this.addChild(moneyBcg, 0);

        let money = new cc.LabelTTF(moneyNum, 'Impact');
        money.setFontSize(100);
        money.setAnchorPoint(cc.p(0.5, 0.5));
        money.setPosition(cc.p(size.width - 250, size.height - 38));
        money.setScaleX(26 / moneyBcg.getBoundingBox().width);
        money.setScaleY(10 / moneyBcg.getBoundingBox().height);
        money.setTag('money');

        this.addChild(money, 0);

        let progressBarBcg = new cc.Sprite.create(res.progressBarBcg);
        progressBarBcg.setAnchorPoint(cc.p(0.5, 1));
        progressBarBcg.setPosition(cc.p(size.width / 2 - 45, size.height));
        progressBarBcg.setScaleX(380 / progressBarBcg.getBoundingBox().width);
        progressBarBcg.setScaleY(70 / progressBarBcg.getBoundingBox().height);

        this.addChild(progressBarBcg);

        let progressBarTitle = new cc.LabelTTF('Прогресс', 'Impact');
        progressBarTitle.setFontSize(100);
        progressBarTitle.setAnchorPoint(cc.p(0.5, 1));
        progressBarTitle.setPosition(cc.p(size.width / 2 - 45, size.height - 5));
        progressBarTitle.setScaleX(100 / progressBarBcg.getBoundingBox().width);
        progressBarTitle.setScaleY(15 / progressBarBcg.getBoundingBox().height);

        this.addChild(progressBarTitle, 0);

        let mtBar = new cc.Sprite.create(res.mtBar);
        mtBar.setAnchorPoint(cc.p(0.5, 0.5));
        mtBar.setPosition(cc.p(size.width / 2 - 45, size.height - 45));
        mtBar.setScaleX(350 / mtBar.getBoundingBox().width);
        mtBar.setScaleY(30 / mtBar.getBoundingBox().height);
        mtBar.setTag('mtBar');

        this.addChild(mtBar, 0)

        let barElement = new cc.Sprite.create(res.barElement);
        barElement.setAnchorPoint(cc.p(0, 0.5));
        barElement.setPosition(cc.p(size.width / 2 - 218, size.height - 44));
        barElement.setScaleX(0 / mtBar.getBoundingBox().width);
        barElement.setScaleY(8 / mtBar.getBoundingBox().height);
        barElement.setTag('barEl');

        this.addChild(barElement, 0)


        //set ref
        let ref = new cc.Sprite.create(res.ref);
        ref.setAnchorPoint(cc.p(0.5, 0.5));
        ref.setPosition(cc.p(size.width / 2, size.height / 2));
        ref.setScaleX(size.width / ref.getBoundingBox().width);
        ref.setScaleY(size.height / ref.getBoundingBox().height);
        ref.setOpacity(50);
        ref.setVisible(false);

        this.addChild(ref, 0);

        let movesBcg = new cc.Sprite.create(res.movesBcg);
        movesBcg.setAnchorPoint(cc.p(0.5, 0.5));
        movesBcg.setPosition(cc.p(745, size.height - 225));
        movesBcg.setScaleX(160 / movesBcg.getBoundingBox().width);
        movesBcg.setScaleY(160 / movesBcg.getBoundingBox().height);

        this.addChild(movesBcg, 0);

        let moves = new cc.LabelTTF(movesRemaining, 'Impact');
        moves.setFontSize(100);
        moves.setAnchorPoint(cc.p(0.5, 0.5));
        moves.setPosition(cc.p(745, size.height - 230));
        moves.setScaleX(100 / movesBcg.getBoundingBox().width);
        moves.setScaleY(80 / movesBcg.getBoundingBox().height);
        moves.setTag('movesText');

        this.addChild(moves, 0);

        let scoresBcg = new cc.Sprite.create(res.scoresBcg);
        scoresBcg.setAnchorPoint(cc.p(0.5, 1));
        scoresBcg.setPosition(cc.p(745, size.height - 300));
        scoresBcg.setScaleX(230 / scoresBcg.getBoundingBox().width);
        scoresBcg.setScaleY(90 / scoresBcg.getBoundingBox().height);

        this.addChild(scoresBcg, 0);

        let scoresTitle = new cc.LabelTTF('Очки:', 'Impact');
        scoresTitle.setFontSize(100);
        scoresTitle.setAnchorPoint(cc.p(0.5, 1));
        scoresTitle.setPosition(cc.p(745, size.height - 305));
        scoresTitle.setScaleX(10 / scoresTitle.getBoundingBox().width);
        scoresTitle.setScaleY(5 / scoresTitle.getBoundingBox().height);

        this.addChild(scoresTitle, 0);

        let scores = new cc.LabelTTF(scoresNum.toString(), 'Impact');
        scores.setFontSize(100);
        scores.setAnchorPoint(cc.p(0.5, 1));
        scores.setPosition(cc.p(745, size.height - 335));
        scores.setScaleX(100 / scoresBcg.getBoundingBox().width);
        scores.setScaleY(40 / scoresBcg.getBoundingBox().height);
        scores.setTag('scoresText');

        this.addChild(scores, 0);

        let booster1 = new cc.Sprite.create(res.boosterBcg);
        booster1.setAnchorPoint(cc.p(0.5, 0.5));
        booster1.setPosition(cc.p(625, 120));
        booster1.setScaleX(120 / booster1.getBoundingBox().width);
        booster1.setScaleY(120 / booster1.getBoundingBox().height);

        let booster1Name = new cc.LabelTTF('Бомба', 'Impact');
        booster1Name.setFontSize(100);
        booster1Name.setAnchorPoint(cc.p(0.5, 0.5));
        booster1Name.setPosition(cc.p(625, 130));
        booster1Name.setScaleX(30 / booster1.getBoundingBox().width);
        booster1Name.setScaleY(20 / booster1.getBoundingBox().height);

        let booster1priceBcg = new cc.Sprite.create(res.boosterPriceBcg);
        booster1priceBcg.setAnchorPoint(cc.p(0.5, 0.5));
        booster1priceBcg.setPosition(cc.p(625, 98));
        booster1priceBcg.setScaleX(90 / booster1priceBcg.getBoundingBox().width);
        booster1priceBcg.setScaleY(40 / booster1priceBcg.getBoundingBox().height);

        let booster1price = new cc.LabelTTF(bombBooster.price.toString(), 'Impact');
        booster1price.setFontSize(100);
        booster1price.setAnchorPoint(cc.p(0.5, 0.5));
        booster1price.setPosition(cc.p(625, 95));
        booster1price.setScaleX(20 / booster1priceBcg.getBoundingBox().width);
        booster1price.setScaleY(10 / booster1priceBcg.getBoundingBox().height);

        let booster1Clickable = new cc.Sprite.create(res.boosterPriceBcg);
        booster1Clickable.setAnchorPoint(cc.p(0.5, 0.5));
        booster1Clickable.setPosition(cc.p(625, 120));
        booster1Clickable.setScaleX(120 / booster1Clickable.getBoundingBox().width);
        booster1Clickable.setScaleY(120 / booster1Clickable.getBoundingBox().height);
        booster1Clickable.setOpacity(0);
        booster1Clickable.setTag('bombBoost');

        this.addChild(booster1, 0);
        this.addChild(booster1Name, 0);
        this.addChild(booster1priceBcg, 0);
        this.addChild(booster1price, 0);
        this.addChild(booster1Clickable, 0);
    },
    createBlock: function (blockColors, x, y, blockSizeX, blockSizeY, listener) {

        colorID = Math.floor(Math.random() * blockColors.length);
        let block = new cc.Sprite.create(blockColors[colorID]);
        block.setAnchorPoint(cc.p(0, 1));
        block.setPosition(cc.p(x, y));
        block.setScaleX(blockSizeX / block.getBoundingBox().width);
        block.setScaleY(blockSizeY / block.getBoundingBox().height);
        block.colorID = colorID;
        block.typee = 'coloredBlock';
        block.checkedd = false;
        cc.eventManager.addListener(listener.clone(), block);
        return block;
    },
    spawNewBlocks: function (map, gameSizeX, gameSizeY, blockColors, blockSizeX, blockSizeY, listener) {

        let upperRow = map.filter(e => e.y == map[0].y && !e.block);

        if (upperRow.length < 1) {

            return;
        }

        upperRow.forEach(e => {


            e.block = this.createBlock(blockColors, e.x, e.y + blockSizeY, blockSizeX, blockSizeY, listener);
            this.addChild(e.block);

            e.block.runAction(new cc.MoveBy(0.2, 0, -blockSizeY));
        });

        moveBlocksDown(map, gameSizeX, gameSizeY, blockSizeY);
        this.spawNewBlocks(map, gameSizeX, gameSizeY, blockColors, blockSizeX, blockSizeY, listener);
    }
});

const createField = (gameSizeX, gameSizeY, blockSizeX, blockSizeY, startPointX, startPointY) => {

    let map = [];

    for (let i = 0; i < gameSizeY; i++) {

        for (let j = 0; j < gameSizeX; j++) {

            map.push({ x: startPointX + (j * blockSizeX), y: (startPointY - blockSizeY) - (i * blockSizeY), block: null });
        }
    }
    return map;
}

const getTileByBlock = (map, block) => {

    let tile = map.filter(e => e.block == block)[0];
    return tile;
}

const countSimilarBlocks = (map, x, y, color, gameSizeY, gameSizeX) => {

    let tile = map[x + (y * gameSizeY)];

    if (!tile || !tile.block || x < 0 || x > gameSizeX - 1) {

        return;
    }

    let block = tile.block;

    if (block.checkedd || block.colorID != color) {

        return;
    }

    block.checkedd = true;

    countSimilarBlocks(map, x - 1, y, color, gameSizeY, gameSizeX);
    countSimilarBlocks(map, x + 1, y, color, gameSizeY, gameSizeX);
    countSimilarBlocks(map, x, y - 1, color, gameSizeY, gameSizeX);
    countSimilarBlocks(map, x, y + 1, color, gameSizeY, gameSizeX);
}

const moveBlocksDown = (map, gameSizeX, gameSizeY, blockSizeY) => {

    let holes = map.filter(e => !e.block);
    let toMove = [];

    if (holes.length < 1) {

        return;
    }

    for (let i = map.length - 1; i > 0; i--) {

        let block = map[i].block;
        let blockTile = map[i];

        if (!block) {

            let x = i % gameSizeX;
            let y = Math.floor(i / gameSizeY);

            let upperBlockTile = map[x + ((y - 1) * gameSizeY)];

            if (upperBlockTile && map[x + ((y - 1) * gameSizeY)].block) {

                let upperBlock = map[x + ((y - 1) * gameSizeY)].block;

                if (upperBlockTile && upperBlock) {

                    blockTile.block = upperBlock;
                    upperBlockTile.block = null;

                    upperBlock.runAction(new cc.MoveBy(0.2, 0, -blockSizeY));
                }
            }
        }
    }
}

const isPossibleToGo = (map, minBlastable, gameSizeX, gameSizeY) => {

    for (let i = 0; i < map.length; i++) {

        let tileXIndex = i % gameSizeX;
        let tileYIndex = Math.floor(i / gameSizeX);

        countSimilarBlocks(map, tileXIndex, tileYIndex, map[i].block.colorID, gameSizeX, gameSizeY);

        let group = map.filter(e => e.block && e.block.checkedd);

        if (group.length > minBlastable) {

            group.forEach(e => { e.block.checkedd = false; });
            return true;
        } else {

            group.forEach(e => { e.block.checkedd = false; });
        }
    }

    return false;
}

const shuffleBlocks = (map, minBlastable, gameSizeX, gameSizeY) => {

    let newCords = map.map(e => {

        return e.block;
    }).sort(() => 0.5 - Math.random());

    for (let i = 0; i < map.length; i++) {

        map[i].block = newCords[i];
        map[i].block.stopAllActions();
        map[i].block.runAction(new cc.MoveTo(0.5, map[i].x, map[i].y));
    }

    if (!isPossibleToGo(map, minBlastable, gameSizeX, gameSizeY)) {

        shuffleBlocks(map);
    }
}

const bombBlocks = (map, x, y, radius, gameSizeX, gameSizeY) => {

    let tile = map[x + (y * gameSizeY)];

    let toBomb = map.map((e, i) => {

        let xx = i % gameSizeX;
        let yy = Math.floor(i / gameSizeX);

        if (xx > x - radius && xx < x + radius && yy > y - radius && yy < y + radius) {

            tile = map[xx + (yy * gameSizeY)];

            return tile;
        }
    });

    toBomb = toBomb.filter(e => e);

    return toBomb;
}

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});