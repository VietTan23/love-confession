import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${props => props.showFireworks ? '#000000' : 'linear-gradient(to right, #ff758c, #ff7eb3)'};
  position: relative;
  overflow: hidden;
  transition: background 1s ease;
`;

const Message = styled(motion.div)`
  font-size: 2rem;
  color: white;
  text-align: center;
  margin: 20px;
  z-index: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
`;

const Button = styled(motion.button)`
  padding: 15px 30px;
  font-size: 1.2rem;
  border: none;
  border-radius: 50px;
  background-color: white;
  color: #ff758c;
  cursor: pointer;
  margin: 10px;
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #ffd3e0;
  }
`;

const Heart = styled(motion.div)`
  font-size: 100px;
  margin: 20px;
  z-index: 1;
`;

const FireworkButton = styled(motion.button)`
  padding: 15px 30px;
  font-size: 1.2rem;
  border: none;
  border-radius: 50px;
  background-color: #ffd700;
  color: #ff4d4d;
  cursor: pointer;
  margin: 20px;
  z-index: 1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: #ffed4a;
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
`;

function App() {
  const [step, setStep] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [yesPressed, setYesPressed] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const canvasRef = useRef(null);

  const messages = [
    "Em có thể cho anh cơ hội được không?",
    "Em à, anh thích em nhiều lắm",
    "Anh không thể ngừng nghĩ về em",
    "Em là điều tuyệt vời nhất đến với anh",
    "Em có thể làm người yêu anh không?"
  ];

  const settings = {
    particles: {
      length: 500,
      duration: 2,
      velocity: 100,
      effect: -0.75,
      size: 30,
    },
    rocket: {
      size: 15,
      speed: 3,
      acceleration: 1.01,
      friction: 0.99,
      explosionParticles: 30
    }
  };

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const normalParticles = {
    background: {
      opacity: 0
    },
    fpsLimit: 60,
    particles: {
      color: {
        value: "#ffffff"
      },
      move: {
        direction: "none",
        enable: true,
        outModes: "bounce",
        random: true,
        speed: 2,
        straight: false
      },
      number: {
        value: 30,
        density: {
          enable: true,
          area: 800
        }
      },
      opacity: {
        value: 0.5
      },
      shape: {
        type: "circle"
      },
      size: {
        value: { min: 5, max: 10 }
      }
    },
    detectRetina: true
  };

  useEffect(() => {
    if (showFireworks && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      let time;
      let particles;
      let particleRate;
      let rocketY;
      let rocketVelocity;
      let isRocketPhase = true;
      let explosionParticles = [];

      // Point class
      class Point {
        constructor(x = 0, y = 0) {
          this.x = x;
          this.y = y;
        }

        clone() {
          return new Point(this.x, this.y);
        }

        length(length) {
          if (typeof length == 'undefined')
            return Math.sqrt(this.x * this.x + this.y * this.y);
          this.normalize();
          this.x *= length;
          this.y *= length;
          return this;
        }

        normalize() {
          const length = this.length();
          this.x /= length;
          this.y /= length;
          return this;
        }
      }

      // Particle class
      class Particle {
        constructor() {
          this.position = new Point();
          this.velocity = new Point();
          this.acceleration = new Point();
          this.age = 0;
        }

        initialize(x, y, dx, dy) {
          this.position.x = x;
          this.position.y = y;
          this.velocity.x = dx;
          this.velocity.y = dy;
          this.acceleration.x = dx * settings.particles.effect;
          this.acceleration.y = dy * settings.particles.effect;
          this.age = 0;
        }

        update(deltaTime) {
          this.position.x += this.velocity.x * deltaTime;
          this.position.y += this.velocity.y * deltaTime;
          this.velocity.x += this.acceleration.x * deltaTime;
          this.velocity.y += this.acceleration.y * deltaTime;
          this.age += deltaTime;
        }

        draw(context, image) {
          function ease(t) {
            return (--t) * t * t + 1;
          }
          const size = image.width * ease(this.age / settings.particles.duration);
          context.globalAlpha = 1 - this.age / settings.particles.duration;
          context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
        }
      }

      // ParticlePool class
      class ParticlePool {
        constructor(length) {
          this.particles = new Array(length);
          this.firstActive = 0;
          this.firstFree = 0;
          this.duration = settings.particles.duration;

          for (let i = 0; i < this.particles.length; i++) {
            this.particles[i] = new Particle();
          }
        }

        add(x, y, dx, dy) {
          this.particles[this.firstFree].initialize(x, y, dx, dy);

          this.firstFree++;
          if (this.firstFree === this.particles.length) this.firstFree = 0;
          if (this.firstActive === this.firstFree) this.firstActive++;
          if (this.firstActive === this.particles.length) this.firstActive = 0;
        }

        update(deltaTime) {
          let i;

          if (this.firstActive < this.firstFree) {
            for (i = this.firstActive; i < this.firstFree; i++) {
              this.particles[i].update(deltaTime);
            }
          }
          if (this.firstFree < this.firstActive) {
            for (i = this.firstActive; i < this.particles.length; i++) {
              this.particles[i].update(deltaTime);
            }
            for (i = 0; i < this.firstFree; i++) {
              this.particles[i].update(deltaTime);
            }
          }

          while (this.particles[this.firstActive].age >= this.duration && this.firstActive !== this.firstFree) {
            this.firstActive++;
            if (this.firstActive === this.particles.length) this.firstActive = 0;
          }
        }

        draw(context, image) {
          if (this.firstActive < this.firstFree) {
            for (let i = this.firstActive; i < this.firstFree; i++) {
              this.particles[i].draw(context, image);
            }
          }
          if (this.firstFree < this.firstActive) {
            for (let i = this.firstActive; i < this.particles.length; i++) {
              this.particles[i].draw(context, image);
            }
            for (let i = 0; i < this.firstFree; i++) {
              this.particles[i].draw(context, image);
            }
          }
        }
      }

      function pointOnHeart(t) {
        return new Point(
          160 * Math.pow(Math.sin(t), 3),
          130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
        );
      }

      const image = (() => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = settings.particles.size;
        canvas.height = settings.particles.size;

        function to(t) {
          const point = pointOnHeart(t);
          point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
          point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
          return point;
        }

        context.beginPath();
        let t = -Math.PI;
        let point = to(t);
        context.moveTo(point.x, point.y);
        while (t < Math.PI) {
          t += 0.01;
          point = to(t);
          context.lineTo(point.x, point.y);
        }
        context.closePath();
        context.fillStyle = '#ea80b0';
        context.fill();

        const image = new Image();
        image.src = canvas.toDataURL();
        return image;
      })();

      function createExplosionParticle(x, y) {
        return {
          x,
          y,
          angle: Math.random() * Math.PI * 2,
          velocity: Math.random() * 5 + 2,
          size: Math.random() * 3 + 2,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.02
        };
      }

      function drawRocket(x, y) {
        const heartSize = settings.rocket.size;
        
        // Draw heart shape for rocket
        context.fillStyle = '#ff69b4';
        context.beginPath();
        context.moveTo(x, y + heartSize / 4);
        
        // Left curve
        context.bezierCurveTo(
          x - heartSize / 2, y - heartSize / 2,
          x - heartSize, y,
          x, y + heartSize
        );
        
        // Right curve
        context.bezierCurveTo(
          x + heartSize, y,
          x + heartSize / 2, y - heartSize / 2,
          x, y + heartSize / 4
        );
        
        context.fill();
        
        // Draw trail using small hearts
        for (let i = 0; i < 3; i++) {
          const trailY = y + (i + 1) * 15;
          const trailSize = heartSize * (1 - i * 0.2);
          const alpha = 1 - i * 0.3;
          
          context.globalAlpha = alpha;
          context.beginPath();
          context.moveTo(x, trailY + trailSize / 4);
          
          context.bezierCurveTo(
            x - trailSize / 2, trailY - trailSize / 2,
            x - trailSize, trailY,
            x, trailY + trailSize
          );
          
          context.bezierCurveTo(
            x + trailSize, trailY,
            x + trailSize / 2, trailY - trailSize / 2,
            x, trailY + trailSize / 4
          );
          
          context.fill();
        }
        context.globalAlpha = 1;
      }

      function updateExplosion() {
        for (let i = explosionParticles.length - 1; i >= 0; i--) {
          const particle = explosionParticles[i];
          particle.x += Math.cos(particle.angle) * particle.velocity;
          particle.y += Math.sin(particle.angle) * particle.velocity;
          particle.alpha -= particle.decay;
          
          if (particle.alpha <= 0) {
            explosionParticles.splice(i, 1);
          }
        }

        // When explosion is complete, start heart animation
        if (explosionParticles.length === 0 && !isRocketPhase) {
          particles = new ParticlePool(settings.particles.length);
          particleRate = settings.particles.length / settings.particles.duration;
          time = new Date().getTime() / 1000;
        }
      }

      function drawExplosion() {
        context.fillStyle = '#ff69b4';
        explosionParticles.forEach(particle => {
          context.globalAlpha = particle.alpha;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        });
        context.globalAlpha = 1;
      }

      function updateRocket() {
        rocketVelocity *= settings.rocket.acceleration;
        rocketY -= rocketVelocity;
        rocketVelocity *= settings.rocket.friction;

        if (rocketY <= canvas.height * 0.5) {
          isRocketPhase = false;
          // Create explosion particles
          for (let i = 0; i < settings.rocket.explosionParticles; i++) {
            explosionParticles.push(createExplosionParticle(canvas.width / 2, rocketY));
          }
        }
      }

      function render() {
        requestAnimationFrame(render);
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (isRocketPhase) {
          drawRocket(canvas.width / 2, rocketY);
          updateRocket();
        } else if (explosionParticles.length > 0) {
          updateExplosion();
          drawExplosion();
        } else {
          const newTime = new Date().getTime() / 1000;
          const deltaTime = newTime - time;
          time = newTime;

          const amount = particleRate * deltaTime;
          for (let i = 0; i < amount; i++) {
            const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            const dir = pos.clone().length(settings.particles.velocity);
            particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
          }

          particles.update(deltaTime);
          particles.draw(context, image);
        }
      }

      function onResize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        rocketY = canvas.height;
        rocketVelocity = settings.rocket.speed;
      }

      window.addEventListener('resize', onResize);
      onResize();
      render();

      return () => {
        window.removeEventListener('resize', onResize);
      };
    }
  }, [showFireworks]);

  const handleYes = () => {
    setYesPressed(true);
    setTimeout(() => {
      setShowMessage(true);
    }, 2000);
  };

  const handleNo = () => {
    setNoCount(noCount + 1);
    if (step < messages.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFireworks = () => {
    setShowFireworks(true);
  };

  const getNoButtonSize = () => {
    return Math.max(0.8 - noCount * 0.1, 0.3);
  };

  const getYesButtonSize = () => {
    return Math.min(1 + noCount * 1.5, 4); // Tăng size lên 15% mỗi lần, tối đa 2x
  };

  return (
    <Container showFireworks={showFireworks}>
      {!showFireworks && (
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={normalParticles}
        />
      )}
      {showFireworks && <Canvas ref={canvasRef} />}
      
      {!yesPressed ? (
        <>
          <Message
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {messages[step]}
          </Message>
          <div>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleYes}
              style={{ 
                transform: `scale(${getYesButtonSize()})`,
                fontSize: `${1 + noCount * 0.08}rem` // Tăng cả font size
              }}
            >
              Có ❤️
            </Button>
            {step < messages.length - 1 && (
              <Button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNo}
                style={{ 
                  transform: `scale(${getNoButtonSize()})`,
                  opacity: getNoButtonSize()
                }}
              >
                Không
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {!showFireworks && (
            <>
              <Heart
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ❤️
              </Heart>
              <Message
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                Cảm ơn em đã đồng ý! Anh yêu em nhiều lắm! ❤️
              </Message>
              {showMessage && (
                <>
                  <Message
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Anh tặng em màn pháo hoa nha! 🎆
                  </Message>
                  <FireworkButton
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFireworks}
                  >
                    Bắn pháo hoa 🎆
                  </FireworkButton>
                </>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
