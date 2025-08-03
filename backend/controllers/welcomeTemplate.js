export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Letter Management System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #b97b2a, #cfae7b, #cfc7b7); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <img src="cid:logo" alt="SSGI Logo" style="width: 120px; height: auto; margin-bottom: 10px;">
    <h1 style="color: white; margin: 0; letter-spacing: 1px;">Welcome to SSGI</h1>
    <p style="color: white; margin: 5px 0 0 0; font-size: 16px;">Letter Management System</p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.07);">
    <p>Dear <strong>{userName}</strong>,</p>
    <p>Welcome to the SSGI Letter Management System! We're excited to have you on board.</p>
    
    <div style="background-color: #e8f4fd; border-left: 4px solid #b97b2a; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; color: #b97b2a;">Your Account Details:</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> {userName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> {userEmail}</p>
      <p style="margin: 5px 0;"><strong>Department/Sector:</strong> {userDepartment}</p>
    </div>
    
    <p>With your new account, you can:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>Create and manage letters efficiently</li>
      <li>Track letter status and progress</li>
      <li>Access your inbox and sent items</li>
      <li>View detailed analytics and reports</li>
      <li>Collaborate with team members</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{loginURL}" style="background: linear-gradient(to right, #b97b2a, #cfae7b, #cfc7b7); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Get Started</a>
    </div>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <p>Thank you for choosing SSGI Letter Management System!</p>
    <p>Best regards,<br><strong>The SSGI Team</strong></p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #b97b2a; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>© 2024 SSGI. All rights reserved.</p>
  </div>
</body>
</html>
`; 

export const WELCOME_EMAIL_TEMPLATE_AM = `
<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ወደ ደብዳቤ አስተዳደር ስርዓት እንኳን በደህና መጡ</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #b97b2a, #cfae7b, #cfc7b7); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <img src="cid:logo" alt="SSGI Logo" style="width: 120px; height: auto; margin-bottom: 10px;">
    <h1 style="color: white; margin: 0; letter-spacing: 1px;">ወደ SSGI እንኳን በደህና መጡ</h1>
    <p style="color: white; margin: 5px 0 0 0; font-size: 16px;">የደብዳቤ አስተዳደር ስርዓት</p>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.07);">
    <p>ክቡር <strong>{userName}</strong>,</p>
    <p>ወደ SSGI የደብዳቤ አስተዳደር ስርዓት እንኳን በደህና መጡ! በቡድናችን ውስጥ መሆኑን ደስ ብሎናል።</p>
    <div style="background-color: #e8f4fd; border-left: 4px solid #b97b2a; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 10px 0; color: #b97b2a;">የመለያዎ ዝርዝሮች:</h3>
      <p style="margin: 5px 0;"><strong>ስም:</strong> {userName}</p>
      <p style="margin: 5px 0;"><strong>ኢሜይል:</strong> {userEmail}</p>
      <p style="margin: 5px 0;"><strong>መድረሻ/ዳይሬክቶሬት:</strong> {userDepartment}</p>
    </div>
    <p>ከአዲሱ መለያዎ ጋር የሚችሉት:</p>
    <ul style="margin: 20px 0; padding-left: 20px;">
      <li>ደብዳቤዎችን በቀላሉ መፍጠርና መቆጣጠር</li>
      <li>የደብዳቤ ሁኔታና እድገት መከታተል</li>
      <li>የገቢና የወጪ ደብዳቤዎችን ማግኘት</li>
      <li>ዝርዝር ትንታኔና ሪፖርቶችን ማየት</li>
      <li>ከቡድን አባላት ጋር መስራት</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{loginURL}" style="background: linear-gradient(to right, #b97b2a, #cfae7b, #cfc7b7); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">መጀመሪያ ይግቡ</a>
    </div>
    <p>ማንኛውንም ጥያቄ ወይም እርዳታ ካስፈለገዎት፣ እባክዎ የድጋፍ ቡድናችንን ያናግሩ።</p>
    <p>SSGI የደብዳቤ አስተዳደር ስርዓትን ስለመረጡ እናመሰግናለን!</p>
    <p>ከተከበሩ ሰላምታዎች ጋር,<br><strong>የSSGI ቡድን</strong></p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #b97b2a; font-size: 0.8em;">
    <p>ይህ ራሱ በራሱ የተላከ መልእክት ነው፣ እባክዎ አትመልሱበት።</p>
    <p>© 2024 SSGI. መብት የተጠበቀ ነው።</p>
  </div>
</body>
</html>
`; 