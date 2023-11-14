var express = require("express");
var router = express.Router();
const pool = require("../db/db");

/**
 * 발생한 문제
 * customer 테이블에 등록된 회원만 주문이 가능한 상태이다.
 * 회원가입 기능을 만들지 않았는데 어떻함..
 *
 */

// 해야할것
/**
 *
 * 관리자 -> 회원아이디 admin으로 변경후 admin만 인식해서 관리자로 변경
 *
 * 메뉴 - 재료 추가기능
 *
 */

/**
 * 길
 *
 *
 * /basket 장바구니
 *
 * /order 주문내역 조회
 * /supply 재고량 조회 및 재료 구매 기능
 *
 */

// 커피 메뉴 전체 페이지 (메인 페이지)
router.get("/", async (req, res, next) => {
  // const basket = req.session.basket;
  // console.log("!!!", basket);

  // req.session.basket = arr;
  // const basket2 = req.session.basket;
  // console.log("???", basket2);

  const basket = req.session.basket;
  console.log("basket:", basket);

  // 커피 메뉴 전체 조회
  // const coffee = await pool.query("select * from coffee.menu;");
  // console.log("!!!", coffee[0]);

  res.render("index", {
    // coffee: coffee[0],
  });
});

// 커피 물품 검색 기능
router.post("/coffee/search", async (req, res, next) => {
  let { key } = req.body;
  console.log("!!!", typeof key);
  // res.send("성공");

  if (key == "coffee") {
    key = "커피";
  }
  try {
    const coffeeSearch = await pool.query(
      // "select * from coffee.menu where menuCategory like ?",
      "select * from coffee.menu where menuName like ?  or menuCategory like ?",
      ["%" + key + "%", "%" + key + "%"]
    );
    console.log("!!!", coffeeSearch[0]);
    if (coffeeSearch[0] == []) {
      return res.send(
        `<script type = "text/javascript">alert("해당 카테고리가 없습니다."); location.href= "/";</script>`
      );
    }
    return res.render("menuList", { coffee: coffeeSearch[0] });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript">alert("해당 카테고리가 없습니다."); location.href= "/";</script>`
    );
  }
});

router.get("/manage", async (req, res, next) => {
  res.render("manage");
});

// 커피 리스트/메뉴 담으러가기
router.get("/orderList", async (req, res, next) => {
  const coffee = await pool.query("select * from coffee.menu;");
  // console.log("!!!", coffee[0]);
  res.render("menuList", {
    coffee: coffee[0],
  });
});

// 커피/메뉴 상세페이지
router.get("/menuDetail/:menuNumber", async (req, res) => {
  // 임시 장바구니 조회
  const basket = req.session.basket;

  const { menuNumber } = req.params;
  // console.log("number:", menuNumber);
  try {
    // const coffeeDetail = await pool.query(
    //   "select * from coffee.menu where menuNumber = ?",
    //   [menuNumber]
    // );

    //
    const coffee = await pool.query(
      "select * from coffee.menu where menuNumber = ?;",
      [menuNumber]
    );
    // console.log("!!!!", coffee[0]);

    // 선택한 커피의 영양성분까지 조회 (menu_has_ingredient)
    // 영양성분 참조할 데이터가 없으면 해당 메뉴 데이터까지 조회가 안되는 버그가 있음
    const coffeeIngredient = await pool.query(
      "SELECT b.*, c.*, a.ingredientSize FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber where a.menu_menuNumber = ?",
      [menuNumber]
    );

    console.log("???", coffeeIngredient[0]);

    return res.render("coffeeDetail", {
      coffee: coffee[0],
      menuNumber: menuNumber,
      ingredient: coffeeIngredient[0],
    });
  } catch (error) {
    console.log(error);
  }
});

// 커피/메뉴 담기
router.post("/addItem/:menuNumber", async (req, res, next) => {
  const { count, menuNumber, menuPrice, menuName } = req.body;
  // console.log("!!!", count, menuNumber, menuPrice);

  /**
   * 임시 장바구니 쿠키로 만듬
   */
  let basket = [];
  basket.push({
    menuNumber: menuNumber,
    menuName: menuName,
    count: count,
    menuPrice: menuPrice,
  });

  // console.log("!!!", basket);
  // console.log("???", req.session.basket);
  // 중복된 물건 처리
  temp = req.session.basket;
  if (temp != undefined) {
    for (var i = 0; i < temp.length; i++) {
      if (temp[i].menuNumber === menuNumber) {
        basket[i].count = String(
          Number(basket[i].count) + Number(temp[i].count)
        );
        console.log("!!!", temp[i]);
      } else {
        basket.push(temp[i]);
      }
    }
  }

  req.session.basket = basket;
  /**
   * --
   */
  console.log("basket:", req.session.basket);
  res.send(
    `<script type = "text/javascript" >alert("장바구니에 추가되었습니다"); location.href = "/orderList";</script>`
  );
});

// 장바구니 페이지
router.get("/basket", async (req, res, next) => {
  const basket = req.session.basket;
  console.log("장바구니 내역:", basket);
  // let totalMoney = 0;
  try {
    // for (var i = 0; i < basket.length; i++) {
    //   totalMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
    // }
    if (basket == undefined) {
      return res.send(
        `<script type = "text/javascript">alert("장바구니에 물품이 없습니다."); window.history.back();</script>`
      );
    }
    return res.render("basket", { basket: basket });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript">alert("장바구니에 물품이 없습니다."); window.history.back();</script>`
    );
  }
});

// 주문서 페이지
router.post("/order", async (req, res, next) => {
  const { check } = req.body;
  const basket = req.session.basket;

  console.log("basket:", basket);

  console.log("check:", check);

  // 날짜 생성
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let date = today.getDate();
  const wdate = year + "-" + month + "-" + date;

  // 총액 새로 계산
  let resultMoney = 0;

  if (check == undefined) {
    return res.send(
      `<script type = "text/javascript" >alert("주문할 상품을 선택해주세요."); window.history.back();</script>`
    );
  }

  try {
    // 총액 계산 중
    for (var j = 0; j < check.length; j++) {
      for (var i = 0; i < basket.length; i++) {
        if (check[j] == basket[i].menuNumber) {
          resultMoney += Number(basket[i].menuPrice) * Number(basket[i].count);
        }
      }
    }
    console.log("resultMoney", resultMoney);
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript" >alert("주문할 상품을 선택해주세요."); window.history.back();</script>`
    );
  }

  res.render("order", {
    orderDate: wdate,
    resultMoney: resultMoney,
    basket: basket,
    check: check,
  });
});

// 주문하기 기능
router.post("/ordering", async (req, res, next) => {
  const { orderType, orderDate, customerId, check } = req.body;
  try {
    let basket = req.session.basket;
    console.log("basket:", basket);

    // order 테이블에 주문번호 자동생성 (orderType, orderDate, customerId, orderId)
    const users = await pool.query(
      "select * from coffee.customer where customerId = ?",
      [Number(customerId)]
    );
    console.log("users:", users[0][0]);
    if (users[0][0] == undefined) {
      return res.send(
        `<script type = "text/javascript">alert("주문 중 문제가 발생했습니다. 주문서를 다시 확인해주세요."); window.history.back();</script>`
      );
    }

    // 주문하는 사람의 주문번호 생성
    const orderAdd = await pool.query(
      "insert into coffee.order values(?,?,null, ?,?) ",
      [orderType, orderDate, Number(customerId), users[0][0].customerName]
    );

    // order-menu (menuNumber, orderId, menuCount)
    // 주문 번호를 기준으로 select하지 않아서 중복되는 정보이라면 엉뚱한 주문번호를 select 하게된다 -> 해결: 주문번호를 기준으로 최근주문번호부터 맨처음에 뜨게 하게
    // 주문하는 사람의 주문번호 확인
    const orderSel = await pool.query(
      "select * from coffee.order where orderType = ? and orderDate =? and customer_customerId = ? order by orderId desc;",
      [orderType, orderDate, Number(customerId)]
    );
    console.log("orderSel:", orderSel[0]);
    console.log("orderId:", orderSel[0][0]);

    // 선택한 메뉴들만 주문
    for (var j = 0; j < check.length; j++) {
      for (var i = 0; i < basket.length; i++) {
        console.log("basket!:", basket);
        console.log("check!:", check);
        if (check[j] == basket[i].menuNumber) {
          // 주문한 메뉴 주문하기
          const orderMenuAdd = await pool.query(
            "insert into coffee.order_menu values(null, ?,?,?);",
            [
              Number(basket[i].menuNumber),
              Number(orderSel[0][0].orderId),
              basket[i].count,
            ]
          );
        }
      }
    }

    // 주문 후 장바구니 비우기
    req.session.basket = undefined;
    console.log("!@#@!@!#@!", req.session.basket);
    // 주문 완료 신호
    return res.send(
      `<script type = "text/javascript">alert("주문이 완료되었습니다."); location.href="/"</script>`
    );
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">alert("주문 중 문제가 발생했습니다. 주문서를 다시 확인해주세요."; window.history.back();</script>`
    );
  }
});

// 바로구매 페이지
router.post("/purchase", async (req, res) => {
  const { count, menuName, menuNumber, menuPrice } = req.body;
  console.log("purchase:", menuName, menuNumber, menuPrice, count);
  try {
    let basket = [
      {
        menuNumber: menuNumber,
        menuName: menuName,
        count: count,
        menuPrice: menuPrice,
      },
    ];

    req.session.basket = basket;
    // 날짜 생성
    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();
    const totalMoney = Number(basket[0].count) * Number(basket[0].menuPrice);

    // console.log("???", basket[0].count, basket[0].menuPrice);

    const wdate = year + "-" + month + "-" + date;

    return res.render("order", {
      basket: basket,
      orderDate: wdate,
      totalMoney: totalMoney,
    });
  } catch (error) {
    console.log(error);
  }
});

// 주문 내역 조회
router.get("/orderList", async (req, res, next) => {
  const orderList = await pool.query(
    "SELECT b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId;"
  );
  console.log("orderList", orderList[0]);
  res.render("orderList", { data: orderList[0] });
});

// 주문내역 검색
router.get("/orderSearch", async (req, res, next) => {
  res.render("orderSelect");
});

// 주문내역 검색 조회
router.post("/orderSearch/Result", async (req, res, next) => {
  const { customerId } = req.body;

  // console.log("customerId:", customerId);
  try {
    const orderList = await pool.query(
      "SELECT a.menuCount, b.*, c.* FROM coffee.order_menu a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.order c on a.order_orderId = c.orderId where customer_customerId = ? order by orderId ;",
      [Number(customerId)]
    );

    // console.log("orderList:", orderList[0][0].orderId);
    console.log("orderList:", orderList[0]);

    if (orderList[0][0].orderId === undefined) {
      return res.send(
        `<script type = "text/javascript" >alert("해당 회원의 주문 내역이 없습니다."); location.href="/orderSearch";</script>`
      );
    }
    return res.render("orderList", { data: orderList[0] });
  } catch (error) {
    return res.send(
      `<script type = "text/javascript" >alert("해당 회원의 주문 내역이 없습니다."); location.href="/orderSearch";</script>`
    );
  }
});

// 재료 업체별 재고량 페이지
router.get("/supplySearch", async (req, res, next) => {
  const supplyList = await pool.query(
    "SELECT a.*, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
  );
  console.log(supplyList[0]);

  res.render("supplySearch");
});

// 재료 업체별 재고량 조회 기능
// 관리자 판별 코드에서 할지 디비에서 할지 고민하기
router.post("/supplySearch", async (req, res) => {
  const { customerId } = req.body;
  console.log("customerId1:", customerId);
  try {
    const customerCheck = await pool.query(
      "select * from coffee.customer where customerId = ? ",
      [customerId]
    );
    console.log("!@", customerCheck[0]);
    // if (customerCheck[0].length != 0) {
    if (customerCheck[0][0].customerId == 1987) {
      const supplyList = await pool.query(
        "SELECT a.*, b.*, c.* FROM coffee.Supply_has_ingredient a inner join coffee.Supply b on a.Supply_SupplyNumber = b.SupplyNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber;"
      );
      return res.render("supplyList", { supply: supplyList[0] });
    } else {
      return res.send(
        `<script type = "text/javascript" >alert('해당 관리자가 존재하지 않습니다'); location.href = "/supplySearch"; </script>`
      );
    }
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript" >alert('해당 관리자가 존재하지 않습니다'); location.href = "/supplySearch"; </script>`
    );
  }

  console.log(supplyList[0]);
});

// 커피 메뉴 추가 페이지
router.get("/menuAdd", async (req, res, next) => {
  res.render("menuAdd");
});

// 커피 메뉴 추가 기능
router.post("/manage/menuAdd", async (req, res, next) => {
  const { menuName, menuPrice, menuKind } = req.body;
  console.log(menuName, menuPrice, menuKind);
  try {
    const menuAdd = await pool.query(
      "insert into coffee.menu values(null, ?,?,?)",
      [menuName, menuPrice, menuKind]
    );
    console.log(menuAdd);
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가되었습니다."); location.href = "/manage";</script>`
    );
  } catch (error) {
    console.log(error);
    return res.send(
      `<script type = "text/javascript">alert("메뉴가 추가실패."); location.href = "/manage";</script>`
    );
  }
});

// 업체별 재료 추가 페이지
router.get("/ingredientAdd", async (req, res, next) => {
  const supply = await pool.query("select * from coffee.Supply;");
  console.log("supply:", supply[0]);
  res.render("ingredientAdd", { company: supply[0] });
});

// 업체별 재료 추가 기능
router.post("/ingredientAdd", async (req, res, next) => {
  const { company, ingredientName, count, ingredientPrice } = req.body;
  console.log(company, ingredientName, ingredientPrice, count);
  const supply = await pool.query(
    "select SupplyNumber from coffee.Supply where Supplyname = ?",
    [company]
  );
  console.log("supply:", supply[0]);

  const menu = await pool.query(
    "select ingredientNumber from coffee.ingredient where ingredientName = ?",
    [ingredientName]
  );
  console.log("menu:", menu[0]);

  try {
    const ingredient_supply = await pool.query(
      "insert into coffee.Supply_has_ingredient values(?,?,?,?)",
      [
        Number(supply[0][0].SupplyNumber),
        Number(menu[0][0].ingredientNumber),
        count,
        ingredientPrice,
      ]
    );
    res.send(
      `<script type = "text/javascript" >alert("재료를 추가하였습니다"); location.href="/";</script>`
    );
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("해당 재료가 없습니다."); window.history.back();</script>`
    );
  }
});

// (레시피 추가를 위한 메뉴 목록 페이지)
router.get("/recipe", async (req, res, next) => {
  const coffee = await pool.query("select * from coffee.menu;");

  res.render("recipeList", { coffee: coffee[0] });
});

// (아이템 디테일)
router.get("/recipeDetail/:menuNumber", async (req, res, next) => {
  const { menuNumber } = req.params;

  try {
    const coffee = await pool.query(
      "select * from coffee.menu where menuNumber = ?",
      [menuNumber]
    );

    const coffeeIngredient = await pool.query(
      "SELECT b.*, c.*, a.ingredientSize FROM coffee.menu_has_ingredient a inner join coffee.menu b on a.menu_menuNumber = b.menuNumber inner join coffee.ingredient c on a.ingredient_ingredientNumber = c.ingredientNumber where a.menu_menuNumber = ?",
      [menuNumber]
    );

    console.log("coffeeIngredient:", coffeeIngredient[0]);

    return res.render("recipeDetail", {
      coffee: coffee[0],
      menuNumber: menuNumber,
      ingredient: coffeeIngredient[0],
    });
  } catch (error) {
    console.log(error);
  }
});

// 레시피 추가 페이지
router.post("/recipe/addPage", async (req, res, next) => {
  const { menuNumber } = req.body;
  const menu = await pool.query(
    "select menuName from coffee.menu where menuNumber = ?",
    [menuNumber]
  );
  res.render("recipeAdd", {
    menuNumber: menuNumber,
    menuName: menu[0][0].menuName,
  });
});

//레시피 추가 기능
router.post("/recipe/add", async (req, res, next) => {
  const { menuNumber, ingredientName, ingredientSize } = req.body;
  try {
    const ingredient = await pool.query(
      "select ingredientNumber from coffee.ingredient where ingredientName = ?",
      [ingredientName]
    );

    console.log(ingredient[0]);
    const recipeAdd = await pool.query(
      "insert into coffee.menu_has_ingredient values(?,?,?)",
      [
        Number(menuNumber),
        Number(ingredient[0][0].ingredientNumber),
        ingredientSize,
      ]
    );
    res.send(
      `<script type = "text/javascript">alert("재료가 추가되었습니다."); location.href = "/recipe";</script>`
    );
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("재료를 다시 확인해주세요."); window.history.back();</script>`
    );
  }
});

// 레시피 수정 기능
router.post("/recipe/update", async (req, res, next) => {
  const { menuNumber, ingredientNumber, name, size } = req.body;
  console.log(menuNumber, ingredientNumber, name, size);
  try {
    for (var i = 0; i < menuNumber.length; i++) {
      const recipeUpdate = await pool.query(
        "update coffee.menu_has_ingredient set ingredientSize = ? where menu_menuNumber = ? and ingredient_ingredientNumber = ? ",
        [size[i], Number(menuNumber[i]), Number(ingredientNumber[i])]
      );
    }
    res.send(
      `<script type = "text/javascript">alert("레시피가 업데이트 되었습니다."); location.href = "/recipe";</script>`
    );
  } catch (error) {
    console.log(error);
    res.send(
      `<script type = "text/javascript">alert("업데이트 오류가 발생하였습니다."); location.href = "/recipe";</script>`
    );
  }
});

//레시피 삭제 기능
router.post("/recipe/del/:target", async (req, res, next) => {
  const { ingredientNumber, menuNumber } = req.body;
  console.log(ingredientNumber, menuNumber);
  try {
    const delIngredient = await pool.query(
      "delete from menu_has_ingredient where ingredient_ingredientNumber = ? and menu_menuNumber = ?",
      [Number(ingredientNumber), Number(menuNumber)]
    );
    return res.send(
      `<script type = "text/javascript">alert("재료를 삭제하였습니다"); window.history.back(); location.reload();</script>`
    );
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
