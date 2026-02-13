import "./App.css";
import { TonConnectButton } from "@tonconnect/ui-react";
import styled from "styled-components";
import { FlexBoxCol } from "./components/styled/styled";
import { TapGame } from "./components/TapGame";
import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

const StyledApp = styled.div`
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  min-height: 100vh;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const AppContainer = styled.div`
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0,0,0,0.2);
`;

const Logo = styled.h1`
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(90deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

function App() {
  useEffect(() => {
    // Expand the app to full height
    WebApp.expand();
    // Set header color
    WebApp.setHeaderColor('#1a1a2e');
    // Ready event
    WebApp.ready();
  }, []);

  return (
    <StyledApp>
      <AppContainer>
        <Header>
          <Logo>⚡ TON TAP</Logo>
          <TonConnectButton />
        </Header>
        <FlexBoxCol style={{ flex: 1 }}>
          <TapGame />
        </FlexBoxCol>
      </AppContainer>
    </StyledApp>
  );
}

export default App;
