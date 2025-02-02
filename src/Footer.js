import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Footer.css';

function Footer() {
    return (
        <footer>
            <Container>
                <Row>
                    {/* Website Link */}
                    <Col xs={12} md={4} className="text-center text-md-start">
                        <p>
                            <a href="https://www.hotelsrikrishna.com" target="_blank" rel="noopener noreferrer">
                                www.hotelsrikrishna.com
                            </a>
                        </p>
                    </Col>
                    {/* Contact Number */}
                    <Col xs={12} md={4} className="text-center">
                        <p>Contact Us @ 7022732215</p>
                    </Col>

                    {/* Address */}
                    <Col xs={12} md={4} className="text-center text-md-end">
                       <p>Main Road, Koraput, Odisha</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;
