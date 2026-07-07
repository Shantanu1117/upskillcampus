// ================================
// FOODIE LOGIN PAGE
// ================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================
    // TYPING EFFECT
    // ======================

    const title = document.querySelector(".left h1");

    const text =
    `Good Food,\nGood Mood`;

    title.innerHTML = "";

    let index = 0;

    function typeText(){

        if(index < text.length){

            if(text[index] === "\n"){
                title.innerHTML += "<br>";
            }
            else{
                title.innerHTML += text[index];
            }

            index++;

            setTimeout(typeText,60);
        }
    }

    typeText();


    // ======================
    // PASSWORD SHOW/HIDE
    // ======================

    const eye =
    document.querySelector(".eye");

    const passwordInput =
    document.querySelector(
        'input[type="password"]'
    );

    eye.addEventListener("click",()=>{

        if(passwordInput.type==="password"){

            passwordInput.type="text";

            eye.classList.remove(
                "ri-eye-line"
            );

            eye.classList.add(
                "ri-eye-off-line"
            );

        }else{

            passwordInput.type="password";

            eye.classList.remove(
                "ri-eye-off-line"
            );

            eye.classList.add(
                "ri-eye-line"
            );
        }

    });



    // ======================
    // LOGIN BUTTON EFFECT
    // ======================

    const loginBtn =
    document.querySelector(".login");

    loginBtn.style.width = "100%";

    loginBtn.addEventListener("mouseenter",()=>{

        loginBtn.style.transform =
        "translateY(-3px)";

        loginBtn.style.boxShadow =
        "0 12px 30px rgba(255,138,0,.4)";
    });

    loginBtn.addEventListener("mouseleave",()=>{

        loginBtn.style.transform =
        "translateY(0)";

        loginBtn.style.boxShadow =
        "none";
    });



    // ======================
    // LOGIN ANIMATION
    // ======================

    loginBtn.addEventListener("click",()=>{

        const oldText =
        loginBtn.innerHTML;

        loginBtn.innerHTML =
        "Logging In...";

        loginBtn.disabled = true;

        setTimeout(()=>{

            loginBtn.innerHTML =
            "✓ Success";

            loginBtn.style.background =
            "#22c55e";

        },1500);

        setTimeout(()=>{

            loginBtn.innerHTML =
            oldText;

            loginBtn.style.background =
            "#ff8a00";

            loginBtn.disabled = false;

        },3000);

    });



    // ======================
    // INPUT GLOW
    // ======================

    const inputs =
    document.querySelectorAll("input");

    inputs.forEach(input=>{

        input.addEventListener("focus",()=>{

            input.style.boxShadow =
            "0 0 20px rgba(255,138,0,.3)";

            input.style.borderColor =
            "#ff8a00";

        });

        input.addEventListener("blur",()=>{

            input.style.boxShadow =
            "none";

            input.style.borderColor =
            "#2a2a2a";

        });

    });



    // ======================
    // SOCIAL HOVER
    // ======================

    document
    .querySelectorAll(".social")
    .forEach(card=>{

        card.addEventListener(
            "mouseenter",
            ()=>{

            card.style.transform =
            "translateY(-5px)";

            card.style.transition =
            ".3s";

        });

        card.addEventListener(
            "mouseleave",
            ()=>{

            card.style.transform =
            "translateY(0px)";

        });

    });



    // ======================
    // OFFER CARD FLOAT
    // ======================

    const offer =
    document.querySelector(".offer");

    let direction = true;

    setInterval(()=>{

        if(direction){

            offer.style.transform =
            "translateY(-8px)";
        }
        else{

            offer.style.transform =
            "translateY(0)";
        }

        offer.style.transition =
        "1.5s";

        direction = !direction;

    },1500);



    // ======================
    // PARALLAX EFFECT
    // ======================

    const container =
    document.querySelector(".container");

    container.addEventListener(
        "mousemove",
        (e)=>{

        const x =
        (window.innerWidth/2 - e.pageX)
        / 40;

        const y =
        (window.innerHeight/2 - e.pageY)
        / 40;

        document.querySelector(
            ".right"
        ).style.transform =

        `translate(${x}px,${y}px)`;

    });




    // ======================
    // TOAST MESSAGE
    // ======================

    function showToast(message){

        const toast =
        document.createElement("div");

        toast.innerHTML = message;

        toast.style.position =
        "fixed";

        toast.style.bottom =
        "30px";

        toast.style.right =
        "30px";

        toast.style.padding =
        "15px 25px";

        toast.style.background =
        "#ff8a00";

        toast.style.color =
        "white";

        toast.style.borderRadius =
        "10px";

        toast.style.zIndex =
        "9999";

        document.body.appendChild(
            toast
        );

        setTimeout(()=>{

            toast.remove();

        },2500);

    }

    loginBtn.addEventListener(
        "click",
        ()=>{

        showToast(
            "Welcome Back 🍔"
        );

    });




    // ======================
    // FLOATING FOOD EMOJIS
    // ======================

    const foods =

    ["🍔","🍟","🍕","🌮","🥤"];

    setInterval(()=>{

        const emoji =
        document.createElement("span");

        emoji.innerHTML =

        foods[
        Math.floor(
        Math.random()*foods.length
        )
        ];

        emoji.style.position =
        "fixed";

        emoji.style.left =
        Math.random()*window.innerWidth
        +"px";

        emoji.style.top =
        window.innerHeight+"px";

        emoji.style.fontSize =
        "28px";

        emoji.style.zIndex =
        "999";

        emoji.style.transition =
        "5s linear";

        document.body.appendChild(
            emoji
        );

        setTimeout(()=>{

            emoji.style.top =
            "-50px";

        },100);

        setTimeout(()=>{

            emoji.remove();

        },5000);

    },2500);



    // ======================
    // ENTRANCE ANIMATION
    // ======================

    document.querySelector(
        ".left"
    ).style.opacity = "0";

    document.querySelector(
        ".right"
    ).style.opacity = "0";

    setTimeout(()=>{

        document.querySelector(
            ".left"
        ).style.transition =
        "1s";

        document.querySelector(
            ".right"
        ).style.transition =
        "1s";

        document.querySelector(
            ".left"
        ).style.opacity = "1";

        document.querySelector(
            ".right"
        ).style.opacity = "1";

    },200);

});// Add to each page's JS
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const text = link.textContent.trim();
        const map = {
            "Home": "mega1.html",
            "Restaurants": "mega4.html",
            "Categories": "mega11.html",
            "Offers": "mega9.html",
            "Track Order": "mega8.html"
        };
        if(map[text]) window.location.href = map[text];
    });
});document
.getElementById("loginBtn")
.addEventListener("click", async () => {
alert("Login button clicked");
    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    if (!email || !password) {
        alert("Fill all fields");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();
alert(JSON.stringify(data));
        console.log(data);

        if (data.success) {

            alert("Login Successful!");

      localStorage.setItem(
    "token",
    data.data.accessToken
);

localStorage.setItem(
    "user",
    JSON.stringify(data.data.user)
);

            window.location.href =
                "mega1.html";

        } else {

            alert(
                data.message ||
                "Login failed"
            );
        }

    } catch (error) {

        console.error(error);

        alert(
            "Cannot connect to backend"
        );
    }

});console.log("LOGIN JS LOADED");
const signupLink = document.querySelector(".signup span");
if (signupLink) {
    signupLink.style.cursor = "pointer";
    signupLink.addEventListener("click", () => {
        window.location.href = "mega3.html";
    });
}