export default function Footer() {
    return (
        <>
            <style>{`
                .site-footer {
                    background: #f5f5f7;
                    border-top: 1px solid #d2d2d7;
                    padding: 16px 22px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .site-footer__inner {
                    max-width: 980px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .site-footer__copy {
                    font-size: 12px;
                    color: #6e6e73;
                    margin: 0;
                }
                .site-footer__region {
                    font-size: 12px;
                    color: #6e6e73;
                    margin: 0;
                }
                @media (max-width: 480px) {
                    .site-footer__inner {
                        justify-content: center;
                        text-align: center;
                    }
                }
            `}</style>
            <footer className="site-footer">
                <div className="site-footer__inner">
                    <p className="site-footer__copy">
                        Copyright @ {new Date().getFullYear()} Paramount Gadgets Inc. All rights reserved.
                    </p>
                    <p className="site-footer__region">Philippines</p>
                </div>
            </footer>
        </>
    )
}
